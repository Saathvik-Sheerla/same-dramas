const express = require('express');
const app = express();
const port = 5500;

app.get('/', (req, res)=>{
    res.send('home');
});

app.listen(port, ()=>{
    console.log(`app listening on http://localhost:${port}`);
});