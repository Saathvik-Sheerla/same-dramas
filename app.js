const express = require('express');
const ejs = require('ejs');
const wiki = require('wikipedia');
const {capitalize} = require('./capitalize');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');
app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
    extended: true,
    }),
);
app.set('view engine','ejs');
app.set('views', path.join(__dirname,'views'));
app.use(express.static(path.join(__dirname,'/public')));
app.set(express.urlencoded({extended: true}));

const port = 5500;

let movies = [
    {
        title: 'Jersey',
        img: 'https://tse4.mm.bing.net/th?id=OIP.cQRTJKDBwz_4Avm9WNr2bwHaDt&pid=Api&P=0&h=180',
    },
    {
        title: 'Seetharamam',
        img: 'https://tse3.mm.bing.net/th?id=OIP.eYISEheQjk7FSFBkjpVZUAHaEK&pid=Api&P=0&h=180',
    },
    {
        title: '12th Fail',
        img: 'https://tse3.mm.bing.net/th?id=OIP.H6r_tEEEC34rwPUL8l_U_AAAAA&pid=Api&P=0&h=180',
    },
    {
        title: 'Gifted',
        img: 'https://3.bp.blogspot.com/-sDWFOoAbL54/WU2JT0crVLI/AAAAAAAAEGU/ALJzeckQvEcVrqd9WiS3gTg3ZEKMTm3OwCLcBGAs/s1600/QUAD_UK_Gifted_f.jpg',
    },
    {
        title: 'Dangal',
        img: 'https://resize.indiatvnews.com/en/resize/newbucket/1200_-/2018/01/featured-dangal-1514956990.jpg',
    },
];

async function getMovieInfo(name){
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
};

app.get('/', (req, res)=>{
    res.send('same-dramas....');
});

app.post('/movie', async (req, res)=>{
    let movieName = req.body.moviename;
    movieName = capitalize(movieName);
    const response = await getMovieInfo(movieName);
    if(response && response.originalimage && response.title){
        let newMovie = {
            title: response.title,
            img: response.originalimage.source,
        }
        movies.unshift(newMovie);
    }
    res.redirect('/home');
});

app.get('/home', (req,res)=>{
    let newMovies = movies;
    res.render('home', {movies});
});

app.listen(port, ()=>{
    console.log(`app listening on http://localhost:${port}`);
});