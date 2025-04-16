const wiki = require("wikipedia");
const { capitalize } = require("../utils/capitalize");
const { recMoviesData } = require('../utils/movies');
const { getMovieInfo } = require('../utils/wikiApi');
const { getSimilarMovies } = require('../utils/geminiApi');

// Initialize movies with the data from movies.js
let movies = [...recMoviesData];
let searchedMovie = null;

// Log initial movies for debugging
console.log("Initial movies loaded:", movies.length);
console.log("First movie:", movies.length > 0 ? movies[0].title : "No movies");

// Fallback image for when Wikipedia doesn't provide one
const FALLBACK_IMAGE = "https://via.placeholder.com/300x450?text=Movie+Poster";

exports.getHome = (req, res) => {
  try {
    res.json({
      status: "success",
      data: {
        movies: movies.slice(0, 10), // Send first 10 movies for initial load
        searchedMovie
      }
    });
  } catch (error) {
    console.error("Error in getHome:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to get home data",
      error: error.message
    });
  }
};

exports.getMoreMovies = async (req, res) => {
  try {
    if (!movies || movies.length < 2) {
      return res.status(400).json({
        status: "error",
        message: "Insufficient movies data"
      });
    }

    searchedMovie = capitalize(movies[1].title);
    const response = await getMovieInfo(searchedMovie);
    
    if (!response || !response.title) {
      return res.status(404).json({
        status: "error",
        message: "Movie information not found"
      });
    }

    // Format the movie data to match movies.js structure
    const newMovie = {
      title: response.title,
      img: response.originalimage ? response.originalimage.source : FALLBACK_IMAGE,
      description: response.extract || `Information about ${response.title}`
    };

    // Get similar movies recommendations using hardcoded data
    const similarMovies = await getSimilarMovies(searchedMovie, response);
    
    // Add recommended movies to the list
    if (similarMovies && similarMovies.genreMovies) {
      for (const movie of similarMovies.genreMovies) {
        const movieInfo = await getMovieInfo(movie.title);
        if (movieInfo && movieInfo.title) {
          movies.unshift({
            title: movieInfo.title,
            img: movieInfo.originalimage ? movieInfo.originalimage.source : FALLBACK_IMAGE,
            description: movieInfo.extract || `Information about ${movieInfo.title}`
          });
        }
      }
    }
    
    searchedMovie = newMovie;
    res.json({
      status: "success",
      message: "Movies updated successfully",
      data: { movies }
    });
  } catch (error) {
    console.error("Error in getMoreMovies:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch more movies"
    });
  }
};

exports.postMovie = async (req, res) => {
  try {
    const { moviename } = req.body;
    
    if (!moviename) {
      return res.status(400).json({
        status: "error",
        message: "Movie name is required"
      });
    }
    
    // Get movie info from Wikipedia
    const movieInfo = await getMovieInfo(moviename);
    
    if (!movieInfo) {
      return res.status(404).json({
        status: "error",
        message: `Movie "${moviename}" not found`
      });
    }

    // Format the searched movie data
    const searchedMovieData = {
      title: movieInfo.title,
      img: movieInfo.originalimage ? movieInfo.originalimage.source : FALLBACK_IMAGE,
      description: movieInfo.extract || `Information about ${movieInfo.title}`,
      genre: movieInfo.genre,
      director: movieInfo.director,
      mainActor: movieInfo.mainActor,
      year: movieInfo.year
    };
    
    // Get similar movies using hardcoded recommendations
    const similarMovies = await getSimilarMovies(moviename, movieInfo);
    
    res.json({
      status: "success",
      message: "Success",
      data: {
        searchedMovie: searchedMovieData,
        similarMovies
      }
    });
  } catch (error) {
    console.error("Error in postMovie:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to process movie request",
      error: error.message
    });
  }
};
