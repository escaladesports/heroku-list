'use strict'
const exec = require('child_process').exec
const cache = require('persistent-cache')()

module.exports = opt => {
	opt = Object.assign({}, opt)
	getOrganization(opt)
		.then(cacheOrganization)
		.then(getApps)
		.then(outputList)
		.catch(console.error)
}

function getOrganization(opt){
	return new Promise((resolve, reject) => {
		if(opt.organization) return resolve(opt)
		cache.get('organization', (err, org) => {
			if(err) reject(err)
			else{
				if(org) opt.organization = org
				resolve(opt)
			}
		})
	})
}
function cacheOrganization(opt){
	return new Promise((resolve, reject) => {
		if(!opt.organization) return resolve(opt)
		cache.put('organization', opt.organization, () => {
			resolve(opt)
		})
	})
}
function deleteCache(opt){
	
}

// heroku apps -o escaladesports --json
// heroku ps -a <app-name> --json

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
function getDynos(name){
	return new Promise((resolve, reject) => {
		exec(`heroku ps --json -a ${name}`, (err, stdout, stderr) => {
			if(err) reject(err)
			else if(stderr) reject(stderr)
			else{
				stdout = JSON.parse(stdout)
				if(stdout.length) stdout = `${name} running on ${stdout.length} dynos`
				else stdout = false
				resolve(stdout)
			}
		})
	})
}
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
