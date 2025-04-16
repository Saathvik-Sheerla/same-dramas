const axios = require('axios');

async function getMovieInfo(movieName) {
  try {
    // First, search for the movie
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(movieName)}%20film&utf8=1&origin=*`;
    const searchResponse = await axios.get(searchUrl);
    
    if (!searchResponse.data.query.search.length) {
      return null;
    }

    const pageId = searchResponse.data.query.search[0].pageid;

    // Get detailed information including images
    const detailUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts|pageimages|revisions&pageids=${pageId}&exintro=1&explaintext=1&piprop=original&rvprop=content&utf8=1&origin=*`;
    const detailResponse = await axios.get(detailUrl);
    
    const page = detailResponse.data.query.pages[pageId];
    const content = page.revisions?.[0]?.['*'] || '';

    // Extract information from the content
    const yearMatch = content.match(/\|\s*release_date\s*=\s*{{.*?(\d{4})/);
    const genreMatch = content.match(/\|\s*genre\s*=\s*{{.*?film.*?}}\s*(\w+)/i) || 
                      content.match(/\|\s*genre\s*=\s*(\w+)/i);
    
    // Extract director information
    const directorMatch = content.match(/\|\s*director\s*=\s*{{.*?\|([^}]+)}}/) ||
                         content.match(/\|\s*director\s*=\s*\[\[([^\]]+)\]\]/) ||
                         content.match(/\|\s*director\s*=\s*([^|\n]+)/);
    
    // Extract starring actors
    const starringMatch = content.match(/\|\s*starring\s*=\s*{{.*?\|([^}]+)}}/) ||
                         content.match(/\|\s*starring\s*=\s*\[\[([^\]]+)\]\]/) ||
                         content.match(/\|\s*starring\s*=\s*([^|\n]+)/);

    // Get a better quality image if available
    let imageUrl = null;
    if (page.original && page.original.source) {
      imageUrl = page.original.source;
    }

    // Try to get a better image from the page content
    if (!imageUrl) {
      const imageMatch = content.match(/\|\s*image\s*=\s*([^|\n]+)/);
      if (imageMatch) {
        const imageName = imageMatch[1].trim();
        const imageApiUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=imageinfo&titles=File:${encodeURIComponent(imageName)}&iiprop=url&origin=*`;
        try {
          const imageResponse = await axios.get(imageApiUrl);
          const pages = imageResponse.data.query.pages;
          const imageInfo = pages[Object.keys(pages)[0]];
          if (imageInfo.imageinfo && imageInfo.imageinfo[0]) {
            imageUrl = imageInfo.imageinfo[0].url;
          }
        } catch (error) {
          console.error('Error fetching image:', error);
        }
      }
    }

    // Clean up the extracted information
    const cleanText = (text) => {
      if (!text) return '';
      return text.split('|')[0]  // Take first item if multiple
        .replace(/\[\[|\]\]/g, '') // Remove wiki brackets
        .replace(/{{|}}|\||<.*?>/g, '') // Remove templates and HTML
        .trim();
    };

    const director = directorMatch ? cleanText(directorMatch[1]) : '';
    const mainActor = starringMatch ? cleanText(starringMatch[1]) : '';
    const genre = genreMatch ? cleanText(genreMatch[1]) : '';

    return {
      title: page.title.replace(/ \(film\)$/, ''),
      extract: page.extract,
      originalimage: { source: imageUrl },
      year: yearMatch ? yearMatch[1] : null,
      genre: genre,
      director: director,
      mainActor: mainActor
    };
  } catch (error) {
    console.error('Error fetching movie info from Wikipedia:', error);
    return null;
  }
}

module.exports = {
  getMovieInfo
}; 