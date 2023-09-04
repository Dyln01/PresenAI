const fs = require('fs');
const path = require('path');

let json = JSON.parse(fs.readFileSync(path.join(__dirname, '../json/topic_styles.json'), {
    encoding: 'utf-8',
}));

module.exports = async function getThemeFromSubject(subject) {
    return json[subject.toString()];
};