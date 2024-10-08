module.exports.capitalize = (str)=>{
    return str.replace(/\b[a-z]/g, (match) => match.toUpperCase());
}