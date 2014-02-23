![image](service-structure.png)

### Services
##### Wager Service
The wager service is the main hub. It delegates implementation to the different "sub-services".

##### Authentication Service
The Authentication service is basically a proxy towards the partner integrations.

> TODO: The Authentication service talks to the partner and will need to be able to propagate data from the partner to the client side partner integration.

##### Configuration Service

> TODO: There should be a configuration service

##### Backoffice Service

> TODO: There should be a configuration service. The backoffice servivce should probably be a lot of different services that can pull data out of different databases etc.

##### Game Service
The Game service is actually on game service per game implementation. It must implement an API that is common for allthe games. That API is basically requiring that the game can say how much a wager request will cost and how much it will reward.
The game service doesn't have a notion of money or currency. It is just given a seed and a game data.
From that it should calculate the cost and the result in an integer.
It will also return a map of metadata.
Things in the metadata could for example be `number_of_cherries` or `bonus_spins_won`.
That data can then be used by the Analytics service to be able to mine behavioural data and by the Campaign service to give extra bonuses that is outside the game.
The Game service can delegate to other subservices or implement persistance with a database. That is up to the game entirely.

##### Campaign Service
The Campaign services responsibility is to keep track of running campaign. It has the ability to give discounts and bonuses on wagers. A discount could be given when there is free games campaigns. A bonus can be given for example when the user spins her 1000:nd spin.

> TODO: The campaign service should probably be a lot of different smaller services. One for each type of campaign.

##### Portfolio Service
The Portfolio service keeps track of the partner and or users game portfolio. Some games can be activated only for a subset of users, partners or devices of thereof.

##### Analytics Service
The Analytics service gather data both about the behaviour of different users and performance of the system.
It can be implemented as a proxy for other 3:rd party products such as Google Analytics and New Relic.

> TODO: Is it a good idea to use a graph database like neo4j for this instead of using a 3:rd party service?

##### Transaction Service
The transaction service has two responsibilities (TODO: should it? Maybe that shold be a separate step). First communicate with the partner integration and create and close transactions. It also gets a random seed for the transaction from the Random Generator service.
That random seed will be used to calculate the result by the Game service

> TODO: This must be able to propagate data from the partner to the front end partner integration.

##### Random Generator Service
The Random Generator service only responisility is to provide evenly distributed random numbers.

> TODO: Maybe the game should talk to the random number generator service directly. But we want as many services as possible to be idempotent and stateless. One way could be that we get a seed that the game then can use in the rest of the random calls. That seed needs to be really big I guess.

##### Replay Service
The replay service stores replays of wagers. It does this basically by storing the full request and response by the client so that can be replayed later. It also keeps track of whitch wagers results that has been seen by the user.
The Replay service privides an interface for the game client to list and get old wagers

> TODO: There should also be a way to report the progress of the replay. So when the game is running on the client it can store what boxes that was opened in a pick and click game and what freespins that has already been seen etc.


###Doing a Wager

Wager is the only publicly exposed service.
It will in turn start a chain of requests to subservices.
The wager service doesn't really do anythin other than orchestrate a wager.

1. `Game client` sends `Wager` to the `Wager service`
2. The `Wager service` sends in paralell
	* `Authenticate` to the `Authentication service` witch in turn contacts the `Partner` to verify the credentials
	* `Get Cost` to the `Game service` to get the cost of the wager
	* `Get Discounts` to the `Campagin service` to know if there is any discounts for the wager (e.g. free game campaigns). The `Campaign service` may or may not read and write to a database.
	* `Can play game` to the `Portfolio service` to know if the game is available for the user/partner
2. The `Wager service` sends `Place Wager` to the `Transaction Service` witch in turn creates a transaction with the partner. The `Transaction service` also gets a random seed from the `Random Generator service` that will be used for the game result later.
3. The `Wager service` sends `Get Result` to the `Game service` to get the full wager result including bonus games.
4. The `Wager service` sends `Apply Campaigns` to the `Campaign service`
5. The `Wager service` sends `Complete Wager` to the `Transaction service` that in turn completes the wager with the `Partner`
6. The `Wager service` sends `Store Wager` to the `Replay service` that persists all the data.

At all the different stages events can be tracked in the `Analytics service`.

The `Game service` can be any implementation of a game. e.g. `Zeus`, `Amazon Queen` etc.

All services can be sharded or clustered behind a load balancer.
	




###WagerService.wager()

The game client does one request to the wager service.
The wager service will in turn proxy the information to the sub-services in the correct order.
The `arbitrary` field is for partner specific data in both the request and the reponse.
The `campaigns` field is storing informations for campaigns the wager should participate in.
The `game` field will be proxied to the `Game service`.
######REQUEST
```
{
  "gamecode": "somegame",
  "credentials":
  {
	"acccount_id": "ABCDEF1234",
    "ticket": "ABCDEF1234",
    "partner": "somepartner",
    "currency": "EUR"
  },
  "retry": 0,
  "game": {
    "bet_units": 1234,
    "bet_per_unit": 1234
  },
  "campaign": {
    "ABC123": {
      "...": "..."
    },
    "BCD234": {
      "...": "..."
    }
  },
  "arbitrary": {
    "bwin": {
      "ticket": "ABCD1234"
    }
  }
}
```
######RESPONSE
```
{
  "bet": 12345,
  "win": 12345,
  "balance": 12345,
  "currency" : "EUR"
  "game": {
    "stoppositions": [1,2,3,4,5],
    "bonus_freespins": [
      [1,2,3,4,5],
      [1,2,3,4,5],
      [1,2,3,4,5]
    ]
  },
  "campaign": {
    "ABC123": {
      "...": "..."
    }
  },
  "arbitrary": {
    "bwin": {
      "transationid": "12345",
      "...": "..."
    }
  }
}
```

###AuthenticationService.authenticate()

######REQUEST
```
{
  "request": "abcd1234",
  "partner": "somepartner",
  "account": "ABCDEF1234",
  "ticket": "ABCDEF1234",
  "currency": "EUR"
}
```
######RESPONSE
```
{
  "player": "ABCDEF1234"
}
```

###PortfolioService.canPlayGame()

######REQUEST
```
{
  "request": "abcd1234",
  "partner": "somepartner",
  "game": "somegame",
  "currency": "EUR",
  "player": "ABCDEF1234"
}
```
######RESPONSE
```
{
  "can_play": true
}
```

###GameService.getCost()

TODO: Should the game service also respond with a hash of the request? That can then be compared to the has returned by the getResult() function. That way the Wager service could verify that it is the same wager that the game service is calculating the cost and the result of. This would minimy the risk of the system tampering with results. The transaction service could also generate a hash that would be included in the game services hash.
I'm looking for a way to "commit" the wager without knowing the result when the cost is calculated.

######REQUEST
```
{
  "request": "abcd1234",
  "data": "{game data ...}"
}
```
######RESPONSE
```
{
  "cost": 12345
}
```

###GameService.getResult()

######REQUEST
```
{
  "request": "abcd1234",
  "data": "{game data ...}"
}
```
######RESPONSE
```
{
  "result": 12345
  "metadata": {metadata...}
}
```

###RandomGeneratorService.getRandomSeed()

######REQUEST
```
{
  "request": "abcd1234"
}
```
######RESPONSE
```
{
 "seed": "123456789"
}
```

###CampaignService.applyCampaigns()

######REQUEST
```
{
  "request": "abcd1234",
  "partner": "somepartner",
  "game": "somegame",
  "player": "abcd1234",
  "data": "{campaign data ...}",
  "cost": 12345,
  "win": 12345,
  "meta": "{meta from GameService.getResult response ...}"
}
```
######RESPONSE
```
{
  "request": "abcd1234",
  "extra_win": 12345,
  "data": "{campaign data ...}"
}
```

###CampaignService.getDiscount()

######REQUEST
```
{
  "request": "abcd1234",
  "partner": "somepartner",
  "game": "somegame",
  "player": "abcd1234",
  "data": "{campaign data ...}",
  "cost": 12345
}
```
######RESPONSE
```
{
  "discount": 12345,
  "data": "{campaign data ...}"
}
```

###TransactionService.placeWager()

######REQUEST
```
{
  "request": "abcd1234",
  "partner": "somepartner",
  "player": "ABCDEF1234",
  "account": "ABCDEF1234",
  "ticket": "ABCDEF1234",
  "game": "somegame",
  "currency": "EUR",
  "amount": 12345
}
```
######RESPONSE
```
{
  "transaction": "ABCDEF1234",
  "seed": "123456789"
}
```

###TransactionService.completeWager()

######REQUEST
```
{
  "request": "abcd1234",
  "transaction": "ABCDEF1234",
  "partner": "somepartner",
  "player": "ABCDEF1234",
  "account": "ABCDEF1234",
  "ticket": "ABCDEF1234",
  "game": "somegame",
  "currency": "EUR",
  "amount": 12345
}
```
######RESPONSE
```
{
  "balance": 12345,
  "currency": "EUR"
}
```

###ReplayService.storeWager()

######REQUEST
```
{
  "request": "abcd1234",
  "player": "abcd1234",
  "client_request": "{client request ...}",
  "client_response": "{client response ...}"
}
```
######RESPONSE
```
{
}
```

###AnalyticsService.track()

######REQUEST
```
{
  "request": "abcd1234",
  "partner": "somepartner",
  "player": "abcd1234",
  "bet": 12345,
  "win": 12345,
  "meta": "{meta from GameService.GetResult response ...}",
  "timings": {
    "autheticate": 12345,
    "can_play_game": 12345,
    "...": "..."
  }
}
```
######RESPONSE
```
{
}
```







