#!/usr/bin/env node
const herokuDotenv = require('./index')
const meow = require('meow')
const cli = meow(`
	Usage
	  $ heroku-list <function>
	Options
	  -o, --organization  Lists all apps for given organization
`, {
	alias: {
		o: 'organization'
	}
})
herokuDotenv(cli.flags)
