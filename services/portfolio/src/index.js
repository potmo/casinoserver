var util = require('util');
var	express = require('express');
var	expressValidator = require('express-validator');
var	app = express();

// TODO: Seems like express is depricating the bodyParser
// should instead use
// app.use(connect.urlencoded())
// app.use(connect.json())
// don't know how that works with express-validator
app.use(express.bodyParser());
app.use(expressValidator([])); // this line must be immediately after express.bodyParser()!

app.post('/can_play_game', function(req, res) {


	// marshall request
	req.checkBody('partner', 'malformed input').notEmpty().isAlphanumeric();
	req.checkBody('game', 'malformed input').notEmpty().isAlphanumeric();
	req.checkBody('currency', 'malformed input').notEmpty().isAlpha().isLength(3,3);
	req.checkBody('player', 'malformed input').notEmpty().isAlphanumeric();

	var errors = req.validationErrors();

	if (errors) {
		res.json({error: errors}, 400);
		return;
	}

	res.json({
		can_play: true
	});
});

app.listen(process.env.PORT || 5000);

module.exports = app;