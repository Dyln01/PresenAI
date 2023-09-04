const https = require('https');
const sbd = require('sbd');

function getInfo(topic) {
  // encode the topic to safely include it in the URL
  const encodedTopic = encodeURIComponent(topic);

  // make a request to the Wikipedia API to get information about the topic
  https.get(`https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro=&explaintext=&titles=${encodedTopic}`, (res) => {
    res.on('data', (data) => {
      // parse the response data as JSON
      const response = JSON.parse(data);

      // get the page ID and extract from the response object
      const pageId = Object.keys(response.query.pages)[0];
      const extract = response.query.pages[pageId].extract;

      // summarize the extract
      const summary = sbd.sentences(extract, { sentences: 3 });

      // print the extract and summary to the console
      console.log(extract);
      console.log('\n');
      console.log('Summary:');
      console.log(summary);
    });
  }).on('error', (error) => {
    console.log(`Error: ${error}`);
  });
}

// example usage
getInfo('javascript'); // prints information about JavaScript and a summary to the console
getInfo('node.js'); // prints information about Node.js and a summary to the console