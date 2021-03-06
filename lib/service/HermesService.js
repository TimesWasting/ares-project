enyo.kind({
	name: "HermesService",
	kind: "Component",
	published: {
		url: null,
		useJsonp: false
	},
	events: {
		onLogin: "",
		onFailure: ""
	},
	create: function() {
		this.inherited(arguments);
	},
	makeUrl: function(inMethod, inId) {
		if (!this.url) {
			throw "Service URL not yet defined";
		}
		return [this.url, inMethod, inId].join("/");
	},
	request: function(inMethod, inPathId, inParams, inHttp) {
		//this.log(inMethod, inPathId);
		if (this.auth) {
			//this.log(this.auth);
			inParams = enyo.mixin(inParams, {
				token: this.auth.token,
				secret: this.auth.secret
			});
		}
		var path = inPathId;
		//var path = this.preparePath(inPathId);
		var req = {};
		var url = this.makeUrl(inMethod, path);
		if (this.useJsonp && (inHttp === "GET" || !inHttp)) {
			req = new enyo.JsonpRequest({
				url: url,
				calbackName: "callback"
			});
		} else {
			req = new enyo.Ajax({
				url: url,
				method: inHttp || "GET",
				handleAs: "json"
			});
		}
		var self = this;
		req.response(function(inSender, inValue){
			if (inValue) {
				return inValue;
			} else {
				return self._handleRequestError();
			}
		}).error(this, function() {
			self._handleRequestError();
		});
		return req.go(inParams);
	},
	_handleRequestError: function() {
		this.error("***");
		enyo.Signals.send("onReloadServices", null);
	},
	listFiles: function(inFolderId) {
		return this.request("list", inFolderId)
			.response(function(inSender, inValue) {
				return inValue.contents;
			});
	},
	fetchFileUrl: function(inFileId) {
		//var path = this.preparePath(inFileId);
		var path = inFileId;
		return this.makeUrl("get", path);
	},
	getFile: function(inFileId) {
		return this.request("get", inFileId, null, null);
	},
	putFile: function(inFileId, inContent) {
		return this.request("put", inFileId, {content: inContent || ""}, "POST");
	},
	createFile: function(inFolderId, inName, inContent) {
		return this.request("createfile", inFolderId + "/" + inName, {content: inContent || ""}, "POST")
			.response(function() {
				return inFolderId;
			})
			;
	},
	createFolder: function(inFolderId, inName) {
		var newFolder = inFolderId + "/" + inName;
		return this.request("createfolder", newFolder)
			.response(function(inSender, inResponse) {
				// FIXME: id of created folder needs to be returned from service
				// FTP node server returns an object, includes 'id' field
				// DROPBOX node server returns an object, has no 'id' field
				//console.log("AresProvider.createFolder: inResponse = ", inResponse);
				return inResponse.id || inResponse.path || newFolder;
			})
			;
	},
	deleteFile: function(inFileId) {
		return this.request("deletefile", inFileId);
	},
	deleteFolder: function(inFolderId) {
		return this.request("deletefolder", inFolderId);
	},
	renameFile: function(inFileId, inNewName) {
		return this.request("renameFile", inFileId, {name: inNewName}, "GET");
	},
	renameFolder: function(inFileId, inNewName) {
		return this.request("renameFolder", inFileId, {name: inNewName}, "GET");
	}
});
