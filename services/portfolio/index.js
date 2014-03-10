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
	req.checkBody('partner', 'invalid body field: partner').notEmpty().isAlphanumeric();
	req.checkBody('game', 'invalid body field: game').notEmpty().isAlphanumeric();
	req.checkBody('currency', 'invalid body field: currency').notEmpty().isAlpha().isLength(3,3);
	req.checkBody('player', 'invalid body field: currency').notEmpty().isAlphanumeric();

	var errors = req.validationErrors();

	if (errors) {
		res.send('There have been validation errors: ' + util.inspect(errors), 400);
		return;
	}

	res.json({
		can_play: true
	});
});

app.listen(8888);