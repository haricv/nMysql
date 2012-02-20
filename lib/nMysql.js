/**
 * nMysql : Mysql Database Connectivity Lib Supporting Multiple levels of connection pooling
 * author : hari@nivid.co
 * date : 2012-02-20
 */

var debug = false;
var TOTAL_DB_POOLS = 10;

var _mysql = require('mysql'); 
var _mysql = require('mysql-pool'); 
var events = require('events'),
	util = require('util'), 
	crypto = require ('crypto');
	



var MySQLPool =  require("mysql-pool").MySQLPool;
 

var nMysql = function(config){ 
	if (typeof (config) == "object"){
		if (debug)nMysql.debug("configuring..");
		this.host 		= config.host;
		this.user 		= config.user;
		this.password  	= config.password; 
		this.database 	= config.database ? config.database : "";
		this.pool_size	= config.pool_size ? config.pool_size : TOTAL_DB_POOLS;
		
		this.connection = this.user + "@" + this.host + ":" + this.database;
		
	}else{
		if (typeof(config) == "undefined" && nMysql.num_pools > 1){
			throw new Error ("there are more than one active db configurations. please specify one");
		}else if (nMysql.num_pools  == 1){
			nMysql.debug ("using active connection");
			this.connection = nMysql.prev_connection;
		}else{
			throw new Error ("You must specify atleast one db configuration to init connection.");
		}
	}
	
	
	
	if (typeof (nMysql.pool) == "undefined"){
		nMysql.pool = new Object();
	} 
	
	if (nMysql.pool[this.connection] == undefined){
		nMysql.prev_connection  = this.connection;
		nMysql.num_pools ++;
		nMysql.pool[this.connection] = new MySQLPool({
		  poolSize: this.pool_size,
		    host: this.host,
		    user: this.user,
		    password: this.password,
		    database: this.database
		});
	}else{
		nMysql.debug ("this settings already in pool");
	}
};

/**shared vars**/
nMysql.UID_counter = 0 ; 
nMysql.num_pools = 0;
nMysql.prev_connection  = "";

 
nMysql.prototype =  new events.EventEmitter;
    
nMysql.prototype.get_uid = function(){
	nMysql.UID_counter ++;
	var md5sum = crypto.createHash('md5');
	md5sum.update(this.connection + "-" + nMysql.UID_counter  );
	
	return md5sum.digest('hex');
}
nMysql.prototype.init = function (){
	
	if (debug)console.log("nMysql >> init"); 
	
	
		nMysql.connect(this);
		if (this.connection != null){
			if (debug) nMysql.debug("connected");
		}
	};
	

nMysql.prototype.set_db =  function (db){  
		this.query('use ' + db); 
	};

nMysql.prototype.query = function( sql ){
	
	//~ console.log ("%j", this.connection.status);
	var self = this;
	var qid = this.get_uid();
		if (debug) console.log("nMysql >> query >> %s " ,sql );
		//console.log ("%j",this.connection);
		nMysql.pool[this.connection].query(sql,function(err, result, fields) {
		    if (err) { self.emit("query_error", qid, err); }
		    else {
			nMysql.debug("query " + qid + " completed",9);
		       self.emit("query_complete" , qid, result,fields);
		    } 
		        if (debug) nMysql.debug("query complete!");
		      
		    });
		
	 return qid;
    
};

nMysql.prototype.check =function (){
	if (debug) nMysql.debug("checking...");
}

nMysql.prototype.end = function (){
	if (debug){ 
		nMysql.debug("connection end");
	}
	//this.connection.end();
}

nMysql.debug = function (msg,level){
	if (!debug && level ==0){return; }
	if (level == undefined ){
		level = 0;
	}
	console.log ("nMysql >> " + msg );
}

exports.connect  = nMysql;

