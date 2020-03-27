const http = require("http");
var fibos:any;

export function fetch(url:string, opts:RequestInit):any {
	if (url.indexOf('fibos') === 0) {
		if (!fibos)
			fibos = require('fibos');

		opts = opts || {};

		return new Promise((resolve, reject) => {
			fibos.post(url.substr(5), opts.body, (err:any, res:any) => {
				if (err) {
					return reject(err);
				}
				resolve({
					status: 200,
					get ok(){return res.statusCode >= 200 && res.statusCode < 300;},
					text: () => new Promise((resolve, reject) => {
						resolve(res);
					}),
					json: () => new Promise((resolve, reject) => {
						try {
							resolve(JSON.parse(res));
						} catch (e) {
							reject(e);
						}
					})
				});
			});
		});

		return;
	}

	opts = opts || {};
	return new Promise((resolve, reject) => {
		let request = opts.method === "POST" ? http.post : http.get;
		delete opts.method;

		request(url, opts, (err:any, res:any) => {
			if (err) {
				return reject(err);
			}
			resolve({
				status: res.statusCode,
				get ok(){return res.statusCode >= 200 && res.statusCode < 300;},
				text: () => new Promise((resolve, reject) => {
					resolve(res.readAll().toString());
				}),
				json: () => new Promise((resolve, reject) => {
					try {
						resolve(res.json());
					} catch (e) {
						reject(e);
					}
				})
			});
		});
	});
}