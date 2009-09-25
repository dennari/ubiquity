mitcho_select_command = {
  url: function() {
    return Application.prefs.getValue('extensions.ubiquity.select.url',false);
  },
  version: '1.0',  tables: [],  columns: {},  
  enforce_tables: function() {
    if (this.tables.length == 0) {
      jQuery.ajax({
        type: "POST", dataType: "json", url: mitcho_select_command.url(), data: {task:'list-tables'},  error: function(e){CmdUtils.log(e)},  success: function(results) {
          mitcho_select_command.tables = results;
        }
      });
    }
  },
  enforce_columns: function(table) {
    if (this.columns[table] == undefined) {
      jQuery.ajax({
        type: "POST", dataType: "json", url: mitcho_select_command.url(),  data: {task:'list-columns',table:table},
        success: function(results) {
          mitcho_select_command.columns[table] = results;
        }
      });
    }
  },
  sql_keywords: ' ABS ACOS ADDDATE AES_ENCRYPT AES_DECRYPT ASCII ASIN ATAN ATAN2 AVG BENCHMARK BIN BIT_AND BIT_COUNT BIT_LENGTH BIT_OR CAST CEIL CEILING CHAR_LENGTH CHARACTER_LENGTH COALESCE CONCAT CONCAT_WS CONNECTION_ID CONV CONVERT COS COT COUNT CURDATE CURRENT_DATE CURRENT_TIME CURRENT_TIMESTAMP CURRENT_USER CURTIME DATABASE DATE_ADD DATE_FORMAT DATE_SUB DAYNAME DAYOFMONTH DAYOFWEEK DAYOFYEAR DECODE DEGREES DES_ENCRYPT DES_DECRYPT ELT ENCODE ENCRYPT EXP EXPORT_SET EXTRACT FIELD FIND_IN_SET FLOOR FORMAT FOUND_ROWS FROM_DAYS FROM_UNIXTIME GET_LOCK GREATEST GROUP_UNIQUE_USERS HEX IFNULL INET_ATON INET_NTOA INSTR INTERVAL IS_FREE_LOCK ISNULL LAST_INSERT_ID LCASE LEAST LEFT LENGTH LN LOAD_FILE LOCATE LOG LOG2 LOG10 LOWER LPAD LTRIM MAKE_SET MASTER_POS_WAIT MAX MD5 MID MIN MOD MONTHNAME NOW NULLIF OCT OCTET_LENGTH ORD PASSWORD PERIOD_ADD PERIOD_DIFF PI POSITION POW POWER QUARTER QUOTE RADIANS RAND RELEASE_LOCK REPEAT REVERSE RIGHT ROUND RPAD RTRIM SEC_TO_TIME SESSION_USER SHA SHA1 SIGN SIN SOUNDEX SPACE SQRT STD STDDEV STRCMP SUBDATE SUBSTRING SUBSTRING_INDEX SUM SYSDATE SYSTEM_USER TAN TIME_FORMAT TIME_TO_SEC TO_DAYS TRIM UCASE UNIQUE_USERS UNIX_TIMESTAMP UPPER USER VERSION WEEK WEEKDAY YEARWEEK AUTO_INCREMENT BDB BERKELEYDB BINARY DEFAULT INNOBASE INNODB ISAM MRG_MYISAM MYISAM NATIONAL PRECISION UNSIGNED VARYING ZEROFILL BIGINT BIT BLOB BOOL CHAR CHARACTER DATE DATETIME DEC DECIMAL DOUBLE ENUM FLOAT FLOAT4 FLOAT8 INT INT1 INT2 INT3 INT4 INT8 INTEGER LONG LONGBLOB LONGTEXT MEDIUMBLOB MEDIUMINT MEDIUMTEXT MIDDLEINT NCHAR NUMERIC REAL SET SMALLINT TEXT TIME TIMESTAMP TINYBLOB TINYINT TINYTEXT VARBINARY VARCHAR YEAR ACTION ADD AFTER AGAINST AGGREGATE ALL ALTER ANALYSE ANALYZE AND AS ASC AUTOCOMMIT AVG_ROW_LENGTH BACKUP BEGIN BETWEEN BOTH BY CASCADE CASE CHANGE CHANGED CHECK CHECKSUM CLIENT COLUMN COLUMNS COMMENT COMMIT COMMITTED COMPRESSED CONCURRENT CONSTRAINT CREATE CROSS DATA DATABASE DATABASES DAY DAY_HOUR DAY_MINUTE DAY_SECOND DELAYED DELAY_KEY_WRITE DELETE DESC DESCRIBE DISTINCT DISTINCTROW DO DROP DUMPFILE DYNAMIC ELSE ENCLOSED END ESCAPE ESCAPED EXECUTE EXISTS EXPLAIN EXTENDED FAST FIELDS FILE FIRST FIXED FLUSH FOR FOREIGN FROM FULL FULLTEXT FUNCTION GEMINI GEMINI_SPIN_RETRIES GLOBAL GRANT GRANTS GROUP HAVING HEAP HIGH_PRIORITY HOSTS HOUR HOUR_MINUTE HOUR_SECOND IDENTIFIED IF IGNORE IN INDEX INDEXES INFILE INNER INSERT INSERT_ID INSERT_METHOD INTERVAL INTO IS ISOLATION JOIN KEY KEYS KILL LAST_INSERT_ID LEADING LEFT LEVEL LIKE LIMIT LINES LOAD LOCAL LOCK LOCKS LOGS LOW_PRIORITY MASTER MASTER_CONNECT_RETRY MASTER_HOST MASTER_LOG_FILE MASTER_LOG_POS MASTER_PASSWORD MASTER_PORT MASTER_USER MATCH MAX_CONNECTIONS_PER_HOUR MAX_QUERIES_PER_HOUR MAX_ROWS MAX_UPDATES_PER_HOUR MEDIUM MERGE MIN_ROWS MINUTE MINUTE_SECOND MODE MODIFY MONTH MRG_MYISAM MYISAM NATURAL NO NOT NULL ON OPEN OPTIMIZE OPTION OPTIONALLY OR ORDER OUTER OUTFILE PACK_KEYS PARTIAL PASSWORD PRIMARY PRIVILEGES PROCEDURE PROCESS PROCESSLIST PURGE QUICK RAID0 RAID_CHUNKS RAID_CHUNKSIZE RAID_TYPE READ REFERENCES REGEXP RELOAD RENAME REPAIR REPEATABLE REPLACE REPLICATION RESET RESTORE RESTRICT RETURNS REVOKE RIGHT RLIKE ROLLBACK ROW ROW_FORMAT ROWS SECOND SELECT SERIALIZABLE SESSION SHARE SHOW SHUTDOWN SLAVE SONAME SQL_AUTO_IS_NULL SQL_BIG_RESULT SQL_BIG_SELECTS SQL_BIG_TABLES SQL_BUFFER_RESULT SQL_LOG_BIN SQL_LOG_OFF SQL_LOG_UPDATE SQL_LOW_PRIORITY_UPDATES SQL_MAX_JOIN_SIZE SQL_QUOTE_SHOW_CREATE SQL_SAFE_UPDATES SQL_SELECT_LIMIT SQL_SLAVE_SKIP_COUNTER SQL_SMALL_RESULT SQL_WARNINGS START STARTING STATUS STOP STRAIGHT_JOIN STRING STRIPED SUPER TABLE TABLES TEMPORARY TERMINATED THEN TO TRAILING TRANSACTION TRUNCATE TYPE UNCOMMITTED UNION UNIQUE UNLOCK UPDATE USAGE USE USING VALUES VARIABLES WHEN WHERE WITH WORK WRITE YEAR_MONTH '
};

noun_type_select = {
  _name: "select arguments",
  suggest: function( text, html ) {
    var suggestions  = [];
    suggestions.push(CmdUtils.makeSugg(text));
    var words = text.split(' ').reverse();
    
    if (mitcho_select_command.url() == '')
      return suggestions;
    
    mitcho_select_command.enforce_tables();
    
    // find all the table names used in the query thus far
    var tables = [];
    for (i in mitcho_select_command.tables) {
      table = mitcho_select_command.tables[i];
      if ((' '+text).replace(',',' ').match(' '+table))
        tables.push(table);
    }
   
    // look at the last character
    // if empty and we've referenced a table, offer its columns
    // BUG: Ubiquity strips off whitespace! WTF!?
    if (text.substr(text.length-1) == ' ' && tables.length > 0) {
      //CmdUtils.log('finding relevant columns');
      for (i in tables) {
        table = tables[i];
        mitcho_select_command.enforce_columns(table);
        for (i in mitcho_select_command.columns[table]) {
          col = mitcho_select_command.columns[table][i];
          suggestions.push( CmdUtils.makeSugg(text + ' ' + col) );
        }
      }
      return suggestions.splice(0, 10);
    }
    
    // see if this word is part of a keyword, but not a complete keyword
    if (mitcho_select_command.sql_keywords.match(' '+words[0],'i') && !mitcho_select_command.sql_keywords.match(' '+words[0]+' ','i')) {
      //CmdUtils.log(words[0] + ' is part of a mysql keyword');
      return suggestions.splice(0, 10);
    }

    // see if this word just completed a keyword or we just opened up a parenthesis or list
    if (mitcho_select_command.sql_keywords.match(' '+words[0]+' ','i') || text.substr(text.length-1) == ',' || text.substr(text.length-1) == '(') {
      // for certain keywords, recommend table names
      if (words[0].match('from','i') || words[0].match('join','i')) {
        for (i in mitcho_select_command.tables) {
          suggestions.push( CmdUtils.makeSugg(text + ' ' + mitcho_select_command.tables[i]) );
        }
      } else {
      // for other keywords (most), suggest known column names
        for (i in tables) {
          table = tables[i];
          mitcho_select_command.enforce_columns(table);
          for (i in mitcho_select_command.columns[table]) {
            col = mitcho_select_command.columns[table][i];
            suggestions.push( CmdUtils.makeSugg(text + ' ' + col) );
          }
        }
      }
      return suggestions.splice(0, 10);
    }
          
    // look to see if it's of type "pre.suf" where pre is a table
    prefix = words[0].substr(0,words[0].indexOf('.'));
    suffix = words[0].slice(words[0].indexOf('.')+1);
    if (prefix != '' && (' '+mitcho_select_command.tables.join(' ')+' ').match(' '+prefix+' ')) {
      // now suggest "pre.suf" type columns of table pre
      mitcho_select_command.enforce_columns(prefix);
    
      for (i in mitcho_select_command.columns[prefix]) {
        col = mitcho_select_command.columns[prefix][i];
        if ((' '+col).match(' '+suffix,'i')) {
          suggestions.push( CmdUtils.makeSugg(text + col.slice(suffix.length)) );
        }
      }
      return suggestions.splice(0, 10);
    }
      
    // see if the word is part of a table name
    if ((' '+mitcho_select_command.tables.join(' ')).match(' '+words[0])) {
      //CmdUtils.log(words[0] + ' is part of a table!');
      for (i in mitcho_select_command.tables) {
        table = mitcho_select_command.tables[i];
        if ((' '+table).match(' '+words[0])) {
          suggestions.push( CmdUtils.makeSugg(text + table.slice(words[0].length)) );
        }
      }
      return suggestions.splice(0, 10);
    }
        
    // see if the word is part of a known column name
    for (i in tables) {
      table = tables[i];
      mitcho_select_command.enforce_columns(table);
      for (i in mitcho_select_command.columns[table]) {
        col = mitcho_select_command.columns[table][i];
        if ((' '+col).match(' '+words[0],'i'))
          suggestions.push( CmdUtils.makeSugg(text + col.slice(words[0].length)) );
      }
    }
  
    // Return a list of input objects, limited to at most ten:
    return suggestions.splice(0, 10);
  }
};

CmdUtils.CreateCommand({
  names: ["select"], homepage: "http://mitcho.com/",  author: { name: "mitcho (Michael Yoshitaka Erlewine)", email: "code@mitcho.com"},  license: "MPL",  icon: "http://mitcho.com/code/select/favicon.ico",
  description: "Execute a select SQL statement and preview the result.",
  help: "You must first identify the <code>select.php</code> resource on your server using the <code>setup-select</code> command. <a href='http://mitcho.com/code/select/'>Documentation here.</a>",
  arguments: {
	  role: 'object',
	  nountype: noun_type_select,
	  label: 'select arguments'
  },  
  preview: function(pblock,args) {
    if (mitcho_select_command.url() == '') {
      pblock.innerHTML = "<p style='color:red;'><code>select</code> is not setup. Please first use the <code>setup-select</code> command.</p>";
      return false;
    }
    if (args.text == '')
      pblock.innerHTML = 'select something';
    else
      pblock.innerHTML = 'select '+args.text+' ...';
   
    rect = pblock.getBoundingClientRect();
    jQuery.ajax({
      type: "POST",
      url: mitcho_select_command.url(),
      data: {task:'select',select:args.text},
      success: function(result) {
	    var width = rect.right-rect.left;
		var height = rect.bottom-rect.top;
		// BUG: right now the height overflow doesn't work right... :(
		if (height > 800 || height < 100)
			height = 800;
        pblock.innerHTML = "<div id='select-results' style='overflow: auto; width: "+width+"; height: "+height+";'>"+result+"</div>";
      }
    });
  },
  execute: function(args) {
    jQuery.ajax({
      type: "POST",
      url: mitcho_select_command.url(),
      data: {task:'select',select:args.text,paste:'paste'},
      success: function(result) {
        CmdUtils.setSelection(result);
      }
    });
  }
});

CmdUtils.CreateCommand({
  names: ["setup-select"],  homepage: "http://mitcho.com/",  author: { name: "mitcho (Michael Yoshitaka Erlewine)", email: "code@mitcho.com"},  license: "MPL",  description: "Setup the <code>select</code> command.",
  help: "<a href='http://mitcho.com/code/select/'>Documentation here.</a>",
  arguments: {
	  role: 'object',
	  nountype: noun_type_url,
	  label: 'URL for setup.php'
  },  
  preview: function(pblock,args) {
    if (args.text == '')
      pblock.innerHTML = 'setup the select command by choosing where your setup.php script is.';
    else
      pblock.innerHTML = 'setup with '+args.text+'?';
  },
  execute: function(args) {
    jQuery.ajax({
      type: "POST",
      url: args.text,
      data: {task:'version'},
      error: function(){
        displayMessage( "Please check your select.php script." );
      },
      success: function(result) {
        if (result == mitcho_select_command.version) {
          Application.prefs.setValue('extensions.ubiquity.select.url',args.text);
          displayMessage( "You can now use the ubiquity command select!" );
          mitcho_select_command.tables = [];
          mitcho_select_command.columns = {};
          mitcho_select_command.enforce_tables();
        } else {
          displayMessage( "Your select.php script is out of date. Please download and install a newer version." );
        }
      }
    });
  }
});

