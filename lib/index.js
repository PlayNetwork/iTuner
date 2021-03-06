var
	levenshtein = require('levenshtein'),
	request = require('request'),
	unidecode = require('unidecode');


var ituner = (function (self) {
	'use strict';

	self = self || {};

	var defaultOptions = {
		allowExplicit : 'Yes',
		searchResultLimit : 10,
		searchUrl : 'http://itunes.apple.com/search',
		timeout : 15000 // 15 seconds
	};

	function closestMatch (query, matches) {
		var
			bestDistance = null,
			bestMatch = null,
			distance = 0;

		matches.some(function (match) {
			distance = new levenshtein(
				query,
				sanitize(match.artistName) + ' ' + sanitize(match.trackName))
			.distance;

			if (bestDistance === null || distance < bestDistance) {
				bestDistance = distance;
				bestMatch = match;
			}

			// 0 is an exact match - no need to process further
			return bestDistance === 0;
		});

		return bestMatch;
	}

	function sanitize (term) {
		var
			i = 0,
			reFeaturing = /\sfeat(uring)?/g, // match " feat" and " featuring"
			reNonAllowableChar = /[^\/\.\-_'a-zA-Z 0-9]+/g; // match anything that is not alpha, numeric, space, ., -, _ and '

		term = unidecode(term.toLowerCase())
			.replace(reNonAllowableChar, ' ') // remove unallowed chars !
			.split(/\s+/).join(' '); // normalize      spaces

		// remove featuring
		i = term.search(reFeaturing);
		if (i > 0) {
			term = term.substring(0, i);
		}

		return term;
	}

	self.findBestMatch = function (query, callback) {
		var match = null;

		self.search(query, function (err, result) {
			if (err) {
				return callback(err);
			}

			if (result.resultCount > 0) {
				match = closestMatch(query, result.results);
			}

			return callback(null, match);
		});
	};

	self.search = function (query, callback) {
		var result = {};

		// sanitize query
		query = sanitize(query);

		request({
			method : 'GET',
			qs : {
				entity : 'song',
				explicit : self.options.allowExplicit,
				limit : self.options.searchResultLimit,
				media : 'music',
				term : query
			},
			timeout : self.options.timeout,
			uri : self.options.searchUrl
		}, function (err, res, body) {
			if (err) {
				return callback(err);
			}

			if (body) {
				try {
					result = JSON.parse(body);
				} catch (ex) {
					err = new Error('unexpected response from iTunes search');
					err.body = body;

					return callback(err);
				}
			}

			if (res.statusCode >= 200 && res.statusCode <= 299) {
				return callback(null, result);
			}

			return callback(result);
		});
	};

	return function (options) {
		options = options || {};

		// apply default for missing keys
		Object.keys(defaultOptions).forEach(function (key) {
			if (typeof options[key] === 'undefined') {
				options[key] = defaultOptions[key];
			}
		});

		self.options = options;

		return self;
	};
}({}));

exports = module.exports = ituner;
exports.initialize = ituner;
