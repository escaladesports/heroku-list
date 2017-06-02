'use strict'
const exec = require('child_process').exec
const storage = require('node-persist')


module.exports = opt => {
	opt = Object.assign({}, opt)
	initStorage(opt)
		.then(getOrganization)
		.then(deleteCache)
		.then(cacheOrganization)
		.then(getApps)
		.then(outputList)
		.catch(console.error)
}

function initStorage(opt){
	return new Promise((resolve, reject) => {
		storage.init()
			.then(() => resolve(opt))
	})
}

// Pull organization cache if none specified
function getOrganization(opt){
	return new Promise((resolve, reject) => {
		if(opt.organization || opt.personal) return resolve(opt)
		const org = storage.getItemSync('organization')
		if(org) opt.organization = org
		resolve(opt)
	})
}

// Cache organization string if exists
function cacheOrganization(opt){
	return new Promise((resolve, reject) => {
		if(!opt.organization) return resolve(opt)
		storage.setItemSync('organization', opt.organization)
		resolve(opt)
	})
}

// Delete organization cache if listing personal apps
function deleteCache(opt){
	return new Promise((resolve, reject) => {
		if(!opt.personal) return resolve(opt)
		storage.setItemSync('organization', null)
		resolve(opt)
	})
}

// Get apps list from Heroku CLI
function getApps(opt){
	return new Promise((resolve, reject) => {
		exec('heroku apps --json' + (opt.organization ? ` -o ${opt.organization}` : ''), (err, stdout, stderr) => {
			if(err) reject(err)
			else if(stderr) reject(stderr)
			else{
				const arr = JSON.parse(stdout)
				const promises = []
				for(let i = 0; i < arr.length; i++){
					promises.push(getDynos(arr[i].name))
				}
				Promise.all(promises)
					.then(list => {
						opt.list = list
						resolve(opt)
					})
					.catch(reject)
			}
		})
	})
}

// Get number of dynos for app
function getDynos(name){
	return new Promise((resolve, reject) => {
		exec(`heroku ps --json -a ${name}`, (err, stdout, stderr) => {
			if(err) reject(err)
			else if(stderr) reject(stderr)
			else{
				stdout = JSON.parse(stdout)
				if(stdout.length){
					stdout = `${name} running on ${stdout.length} dyno${stdout.length > 1 ? 's' : ''}`
				}
				else stdout = false
				resolve(stdout)
			}
		})
	})
}

// Show list of apps
function outputList(opt){
	opt.list = opt.list.filter(str => str)
	let str = '\n'
	if(opt.organization){
		str += `Active apps for organization: ${opt.organization}:`
	}
	else{
		str += 'Active personal apps:'
	}
	str += '\n------------------------------\n'
	str += opt.list.join('\n')
	console.log(str)
}
