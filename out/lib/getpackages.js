// Generated by CoffeeScript 1.6.3
(function() {
  var Getter, TaskGroup, extendr, typeChecker,
    __slice = [].slice;

  extendr = require('extendr');

  typeChecker = require('typechecker');

  TaskGroup = require('taskgroup').TaskGroup;

  Getter = (function() {
    Getter.prototype.entriesMap = null;

    Getter.prototype.config = null;

    function Getter(opts) {
      if (opts == null) {
        opts = {};
      }
      this.config = {};
      this.entriesMap = {};
      extendr.extend(this.config, {
        log: null,
        onlyLatest: true
      }, opts);
      this.feedr = new (require('feedr').Feedr)(this.config);
      this;
    }

    Getter.prototype.log = function() {
      var args, _base;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (typeof (_base = this.config).log === "function") {
        _base.log.apply(_base, args);
      }
      return this;
    };

    Getter.prototype.addEntry = function(entry) {
      var _base, _name;
      this.log('debug', 'Adding the package:', entry != null ? entry.name : void 0);
      if (!(entry != null ? entry.name : void 0)) {
        return null;
      }
      if ((_base = this.entriesMap)[_name = entry.name] == null) {
        _base[_name] = entry;
      }
      return this.entriesMap[entry.name];
    };

    Getter.prototype.getEntries = function(entries) {
      var comparator, exists,
        _this = this;
      this.log('debug', 'Get packages');
      comparator = function(a, b) {
        var A, B;
        A = a.name.toLowerCase();
        B = b.name.toLowerCase();
        if (A === B) {
          return 0;
        } else if (A < B) {
          return -1;
        } else {
          return 1;
        }
      };
      if ((entries != null) === false) {
        entries = this.entriesMap;
      } else {
        if (typeChecker.isArray(entries) === true) {
          exists = {};
          entries = entries.filter(function(repo) {
            var _name;
            if (!(repo != null ? repo.name : void 0)) {
              return false;
            }
            if (exists[_name = repo.name] == null) {
              exists[_name] = 0;
            }
            ++exists[repo.name];
            return exists[repo.name] === 1;
          });
        }
      }
      if (typeChecker.isPlainObject(entries) === true) {
        entries = Object.keys(entries).map(function(key) {
          return entries[key];
        });
      }
      entries = entries.sort(comparator);
      return entries;
    };

    Getter.prototype.requestPackage = function(entryName, opts, next) {
      var feedOptions, me;
      if (opts == null) {
        opts = {};
      }
      me = this;
      feedOptions = {
        url: "http://registry.npmjs.org/" + entryName,
        parse: 'json'
      };
      if (this.config.onlyLatest === true) {
        feedOptions.url += "/latest";
      }
      this.log('debug', 'Requesting package:', entryName, opts, feedOptions);
      this.feedr.readFeed(feedOptions, function(err, entry) {
        var addedEntry;
        if (err) {
          return next(err, {});
        }
        addedEntry = me.addEntry(entry);
        return next(null, addedEntry);
      });
      return this;
    };

    Getter.prototype.fetchPackagesByNames = function(entryNames, next) {
      var entries, me, tasks;
      me = this;
      this.log('debug', 'Fetch packages by name:', entryNames);
      entries = [];
      tasks = new TaskGroup().setConfig({
        concurrency: 0
      }).once('complete', function(err) {
        var result;
        if (err) {
          return next(err, []);
        }
        result = me.getEntries(entries);
        return next(null, result);
      });
      entryNames.forEach(function(entryName) {
        return tasks.addTask(function(complete) {
          return me.requestPackage(entryName, {}, function(err, entry) {
            if (err) {
              return complete(err);
            }
            if (entry) {
              entries.push(entry);
            }
            return complete();
          });
        });
      });
      tasks.run();
      return this;
    };

    Getter.prototype.fetchPackagesByKeyword = function(keyword, next) {
      var feedOptions, feedUrl, me;
      me = this;
      feedUrl = "http://registry.npmjs.org/-/_view/byKeyword?startkey=%5B%22" + keyword + "%22%5D&endkey=%5B%22" + keyword + "%22,%7B%7D%5D&group_level=3";
      feedOptions = {
        url: feedUrl,
        parse: 'json'
      };
      this.log('debug', 'Requesting repos from search:', keyword, feedOptions);
      this.feedr.readFeed(feedOptions, function(err, data) {
        var entryNames, _ref;
        if (err) {
          return next(err, []);
        }
        if (!(data != null ? (_ref = data.rows) != null ? _ref.length : void 0 : void 0)) {
          return next(null, []);
        }
        entryNames = [];
        data.rows.forEach(function(row) {
          var entryName;
          entryName = row.key[1];
          return entryNames.push(entryName);
        });
        return me.fetchPackagesByNames(entryNames, next);
      });
      return this;
    };

    return Getter;

  })();

  module.exports = {
    create: function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return (function(func, args, ctor) {
        ctor.prototype = func.prototype;
        var child = new ctor, result = func.apply(child, args);
        return Object(result) === result ? result : child;
      })(Getter, args, function(){});
    }
  };

}).call(this);
