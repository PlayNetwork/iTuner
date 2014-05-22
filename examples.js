var
	ituner = require('./lib'),

	client = ituner();


client.findBestMatch('beck loser', function (err, result) {
	if (err) {
		console.error(err);
	}

	console.log(result);
});

client.search('beck loser', function (err, result) {
	if (err) {
		console.error(err);
	}

	console.log(result);
});