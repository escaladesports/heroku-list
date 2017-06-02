#!/usr/bin/env node
const herokuList = require('./index')
const meow = require('meow')
const cli = meow(`
	Usage
	  $ heroku-list
	Options
	  -o, --organization  Lists all apps for given organization
	  -p, --personal      Lists all personal apps
`, {
	alias: {
		o: 'organization',
		p: 'personal'
	}
})
herokuList(cli.flags)
