const fs = require('fs');

require('dotenv').config({
    path: '../../server/.env',
});

let topicList = [
  "Architecture",
  "Art",
  "Animals",
  "Biology",
  "Business",
  "Chemistry",
  "Computer Programming",
  "Data Analysis",
  "Design",
  "Food",
  "Music",
  "Economics",
  "Education",
  "Electronics",
  "Engineering",
  "Environmental Science",
  "Nutrition",
  "Health",
  "History",
  "Humans",
  "Language",
  "Law",
  "Literature",
  "Math",
  "Medicine",
  "Physics",
  "Sport",
  "Science",
  "Social Science"
];

module.exports = async function getSubject(chosenTopic) {
  return new Promise((resolve, reject) => {
    try {
      fetch("https://api.ai21.com/studio/v1/j2-jumbo-instruct/complete", {
        headers: {
          "Authorization": `Bearer ${process.env.AI21_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "prompt": `is This ${chosenTopic} topic in this list ${topicList} and what topic is it from the list`,
          "numResults": 1,
          "maxTokens": 2000,
          "temperature": 0.75,
          "topKReturn": 0,
          "topP": 1,
          "countPenalty": {
            "scale": 0,
            "applyToNumbers": false,
            "applyToPunctuations": false,
            "applyToStopwords": false,
            "applyToWhitespaces": false,
            "applyToEmojis": false
          },
          "frequencyPenalty": {
            "scale": 0,
            "applyToNumbers": false,
            "applyToPunctuations": false,
            "applyToStopwords": false,
            "applyToWhitespaces": false,
            "applyToEmojis": false
          },
          "presencePenalty": {
            "scale": 0,
            "applyToNumbers": false,
            "applyToPunctuations": false,
            "applyToStopwords": false,
            "applyToWhitespaces": false,
            "applyToEmojis": false
          },
          "stopSequences": []
        }),
        method: "POST"
      }).then(res => res.json()).then(async json => {
        let topicText = json.completions[0].data.text;
        let topic;
  
        topicList.forEach(e => {
          if (topicText.includes(e)) {
            topic = e;
          };
        });
  
        if (typeof topic === 'string') {
          resolve(topic);
        };
      });
    } catch (err) {
      console.log(err);
    };
  });
};