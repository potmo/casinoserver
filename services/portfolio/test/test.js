var request = require('supertest');

describe('POST /can_play_game', function(){

	var app;

	beforeEach(function(done){
		app = require('../src/index.js'); // can also take a url here
		done();
	});

	it('should work when the request is nice and dandy', function(done){
		request(app)
			.post('/can_play_game')
			.send({ 
				partner: 'apartner', 
				game: 'agame',
				currency: 'SEK',
				player: 'aplayer'
			})
			.set('Accept', 'application/json')
			.expect('Content-Type', /json/)
			.expect({
				can_play: true
			})
			.expect(200, done);
	});

	it('should fail when currency it too long', function(done){
		request(app)
			.post('/can_play_game')
			.send({ 
				partner: 'apartner', 
				game: 'agame',
				currency: 'SEKY',
				player: 'aplayer'
			})
			.set('Accept', 'application/json')
			.expect('Content-Type', /json/)
			.expect(400, done);
	});
});