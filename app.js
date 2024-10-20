const express = require("express");
const ejs = require("ejs");
const wiki = require("wikipedia");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI("AIzaSyDgrPgEeLdK8NlAOc5cj4Uc3DCMohzEjk0");
const { capitalize } = require("./capitalize");
let { moviesData } = require("./movies");
const app = express();
const bodyParser = require("body-parser");
const path = require("path");
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  }),
);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "/public")));
app.set(express.urlencoded({ extended: true }));

const port = 5500;

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
  },
});

async function getSimilarMovies(movie) {
  const result =
    await model.generateContent(
      `suggest exactly 3 similar movies to this movie ,focus on director and movie theme and main lead characters,
      if that movie has prequel and sequels then give them and one very closely related movie, give all three as separate json: ${movie} ,using this JSON schema:
        {json}
        Return: Array<Movie>`);
  // console.log(result);
  return result.response.text();
}

async function getMovieInfo(name) {
  try {
    const page = await wiki.page(name);
    // console.log(page);
    //Response of type @Page object
    const summary = await page.summary();
    // console.log(summary);
    return summary;
    // console.log(response);
    //Response of type @wikiSummary - contains the intro and the main image
  } catch (error) {
    console.log(error);
    //=> Typeof wikiError
  }
}

let movies = moviesData;
// getMovieInfo('Guntur Kaaram');

app.get("/", (req, res) => {
  res.send("same-dramas....");
});

app.get("/home", (req, res) => {
  let newMovies = movies;
  res.render("home", { movies });
});

app.post('/moremovies', async (req, res)=>{
  let movieName = movies[1].title;
  movieName = capitalize(movieName);
  const response = await getMovieInfo(movieName);
  if (response && response.originalimage && response.title) {
    let newMovie = {
      title: response.title,
      img: response.originalimage.source,
    };
    // console.log(newMovie);

    const reccsData = await getSimilarMovies(movieName);
    if (reccsData) {
      try {
        reccsArray = JSON.parse(reccsData);

        if (!Array.isArray(reccsArray)) {
          throw new Error("Parsed data is not an array");
        }

        reccsArray.forEach( async (recc) => {
          const reccMoviesRes = await getMovieInfo(recc.title);
          if (reccMoviesRes && reccMoviesRes.originalimage && reccMoviesRes.title) {
            let reccMovie = {
              title: reccMoviesRes.title,
              img: reccMoviesRes.originalimage.source,
            };
          movies.unshift(reccMovie);
          }
          console.log(recc);
        });
      } catch (error) {
        console.error("Error parsing reccsData:", error);
        console.log("Original reccsData string:", reccsData);
      }
    } else {
      console.error("reccsData is undefined. Cannot access movies.");
    }
  }
  setTimeout(()=>(res.redirect("/home")), 2000);
});

app.post("/movie", async (req, res) => {
  let movieName = req.body.moviename;
  movieName = capitalize(movieName);
  const response = await getMovieInfo(movieName);
  if (response && response.originalimage && response.title) {
    let newMovie = {
      title: response.title,
      img: response.originalimage.source,
    };
    // console.log(newMovie);

    const reccsData = await getSimilarMovies(movieName);
    if (reccsData) {
      try {
        reccsArray = JSON.parse(reccsData);

        if (!Array.isArray(reccsArray)) {
          throw new Error("Parsed data is not an array");
        }

        reccsArray.forEach( async (recc) => {
          const reccMoviesRes = await getMovieInfo(recc.title);
          if (reccMoviesRes && reccMoviesRes.originalimage && reccMoviesRes.title) {
            let reccMovie = {
              title: reccMoviesRes.title,
              img: reccMoviesRes.originalimage.source,
            };
          movies.unshift(reccMovie);
          }
          console.log(recc);
        });
      } catch (error) {
        console.error("Error parsing reccsData:", error);
        console.log("Original reccsData string:", reccsData);
      }
    } else {
      console.error("reccsData is undefined. Cannot access movies.");
    }

    movies.unshift(newMovie);
    
  }
  setTimeout(()=>(res.redirect("/home")), 3000);
});

app.listen(port, () => {
  console.log(`app listening on http://localhost:${port}`);
});
