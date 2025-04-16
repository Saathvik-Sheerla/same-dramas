const { GoogleGenerativeAI } = require("@google/generative-ai");
const { getMovieInfo } = require('./wikiApi');

// Initialize with a default API key if not provided
const API_KEY = process.env.GEMINI_API_KEY || "AIzaSyDJC5a7TvxRwKvnlgGGM2GJtO4eIy-ifBI";

// Initialize the API
const genAI = new GoogleGenerativeAI(API_KEY);

// Get the model
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  generationConfig: {
    responseMimeType: "application/json",
    temperature: 0.7,
    topP: 0.8,
    topK: 40,
  },
});

// Function to get similar movies without using Gemini API
const getSimilarMovies = async (movieName, movieInfo) => {
  try {
    // Genre-based movie recommendations
    // console.log(movieName ,"movie name");
    // console.log(movieInfo);
    const genreRecommendations = {
      "Drama": [
        { title: "The Shawshank Redemption", description: "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency." },
        { title: "Forrest Gump", description: "The presidencies of Kennedy and Johnson, the Vietnam War, the Watergate scandal and other historical events unfold from the perspective of an Alabama man with an IQ of 75." },
        { title: "The Pursuit of Happyness", description: "A struggling salesman takes custody of his son as he's poised to begin a life-changing professional career." }
      ],
      "Action": [
        { title: "The Dark Knight", description: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice." },
        { title: "Inception", description: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O." },
        { title: "Mad Max: Fury Road", description: "In a post-apocalyptic wasteland, a woman rebels against a tyrannical ruler in search for her homeland with the aid of a group of female prisoners, a psychotic worshiper, and a drifter named Max." }
      ],
      "Romance": [
        { title: "The Notebook", description: "A poor yet passionate young man falls in love with a rich young woman, giving her a sense of freedom, but they are soon separated because of their social differences." },
        { title: "La La Land", description: "While navigating their careers in Los Angeles, a pianist and an actress fall in love while attempting to reconcile their aspirations for the future." },
        { title: "Pride and Prejudice", description: "Sparks fly when spirited Elizabeth Bennet meets single, rich, and proud Mr. Darcy. But Mr. Darcy reluctantly finds himself falling in love with a woman beneath his class." }
      ],
      "Comedy": [
        { title: "The Hangover", description: "Three buddies wake up from a bachelor party in Las Vegas, with no memory of the previous night and the bachelor missing." },
        { title: "Bridesmaids", description: "Competition between the maid of honor and a bridesmaid, over who is the bride's best friend, threatens to upend the life of an out-of-work pastry chef." },
        { title: "Superbad", description: "Two co-dependent high school seniors are forced to deal with separation anxiety after their plan to stage a booze-soaked party goes awry." }
      ]
    };

    // Default recommendations if genre doesn't match
    const defaultMovies = [
      { title: "The Godfather", description: "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son." },
      { title: "Pulp Fiction", description: "The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption." },
      { title: "Interstellar", description: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival." }
    ];

    // Get the movie's genre or use a default
    const movieGenre = (movieInfo?.director || '').trim();
    const genreMovies = genreRecommendations[movieGenre] || defaultMovies;
   
    // Fetch detailed information for recommended movies
    
    const fetchMovieDetails = async (movies) => {
      const detailedMovies = [];
      //console.log(movies);
      for (const movie of movies) {
         console.log(movie);
        try {
          const info = await getMovieInfo(movie);
          // console.log(info);
          if (info) {
            detailedMovies.push({
              title: info.title,
              description: movie.description,
              img: info.originalimage?.source || "https://via.placeholder.com/300x450?text=Movie+Poster",
              year: info.year,
              genre: info.genre
            });
          }
        } catch (error) {
          console.error(`Error fetching details for ${movie}:`, error);
        }
      }
      return detailedMovies;
    };

    // Get detailed information for all recommended movies
    const recommendedMovies = await fetchMovieDetails(genreMovies);

    // Split the recommendations into three categories
    const splitMovies = recommendedMovies.reduce((acc, movie, index) => {
      if (index % 3 === 0) acc.actorMovies.push(movie);
      else if (index % 3 === 1) acc.directorMovies.push(movie);
      else acc.genreMovies.push(movie);
      return acc;
    }, { actorMovies: [], directorMovies: [], genreMovies: [] });

    return splitMovies;

  } catch (error) {
    console.error("Error getting similar movies:", error);
    return {
      actorMovies: [],
      directorMovies: [],
      genreMovies: []
    };
  }
};

module.exports = {
  getSimilarMovies
}; 