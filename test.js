const fetch = require("node-fetch");

let quote = fetch("https://zenquotes.io/api/random")
        .then((res) => {
          return res.json();
        })
        .then((data) => {
          return data[0]["q"] + " -" + data[0]["a"];
        });

        console.log(quote);