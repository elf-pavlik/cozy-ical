// Generated by CoffeeScript 1.6.3
(function() {
  var ICalParser, VAlarm, VCalendar, VComponent, VDaylight, VEvent, VFreeBusy, VJournal, VStandard, VTimezone, VTodo, formatUTCOffset, fs, iCalBuffer, lazy, moment, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __slice = [].slice;

  fs = require('fs');

  moment = require('moment');

  lazy = require('lazy');

  module.exports.decorateAlarm = require('./alarm');

  module.exports.decorateEvent = require('./event');

  iCalBuffer = (function() {
    function iCalBuffer() {}

    iCalBuffer.prototype.txt = '';

    iCalBuffer.prototype.addString = function(text) {
      return this.txt += text;
    };

    iCalBuffer.prototype.addStrings = function(texts) {
      var text, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = texts.length; _i < _len; _i++) {
        text = texts[_i];
        _results.push(this.addString(text));
      }
      return _results;
    };

    iCalBuffer.prototype.addLine = function(text) {
      return this.addString("" + text + "\r\n");
    };

    iCalBuffer.prototype.addLines = function(texts) {
      var text, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = texts.length; _i < _len; _i++) {
        text = texts[_i];
        _results.push(this.addLine(text));
      }
      return _results;
    };

    iCalBuffer.prototype.toString = function() {
      return this.txt;
    };

    return iCalBuffer;

  })();

  module.exports.VComponent = VComponent = (function() {
    VComponent.prototype.name = 'VCOMPONENT';

    function VComponent() {
      this.subComponents = [];
      this.fields = {};
    }

    VComponent.prototype.toString = function() {
      var att, buf, component, val, _i, _len, _ref, _ref1;
      buf = new iCalBuffer;
      buf.addLine("BEGIN:" + this.name);
      _ref = this.fields;
      for (att in _ref) {
        val = _ref[att];
        buf.addLine("" + att + ":" + val);
      }
      _ref1 = this.subComponents;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        component = _ref1[_i];
        buf.addLine(component.toString());
      }
      return buf.addString("END:" + this.name);
    };

    VComponent.prototype.formatIcalDate = function(date) {
      return moment(date).format('YYYYMMDDTHHmm00');
    };

    VComponent.prototype.add = function(component) {
      return this.subComponents.push(component);
    };

    VComponent.prototype.walk = function(walker) {
      var sub, _i, _len, _ref, _results;
      walker(this);
      _ref = this.subComponents;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        sub = _ref[_i];
        _results.push(sub.walk(walker));
      }
      return _results;
    };

    return VComponent;

  })();

  module.exports.VCalendar = VCalendar = (function(_super) {
    __extends(VCalendar, _super);

    VCalendar.prototype.name = 'VCALENDAR';

    function VCalendar(organization, title) {
      VCalendar.__super__.constructor.apply(this, arguments);
      this.fields = {
        VERSION: "2.0"
      };
      this.fields['PRODID'] = "-//" + organization + "//NONSGML " + title + "//EN";
    }

    return VCalendar;

  })(VComponent);

  module.exports.VAlarm = VAlarm = (function(_super) {
    __extends(VAlarm, _super);

    VAlarm.prototype.name = 'VALARM';

    function VAlarm(date) {
      VAlarm.__super__.constructor.apply(this, arguments);
      this.fields = {
        ACTION: 'DISPLAY',
        REPEAT: '1',
        "TRIGGER;VALUE=DATE-TIME": this.formatIcalDate(date) + 'Z'
      };
    }

    return VAlarm;

  })(VComponent);

  module.exports.VTodo = VTodo = (function(_super) {
    __extends(VTodo, _super);

    VTodo.prototype.name = 'VTODO';

    function VTodo(date, uid, summary, description) {
      VTodo.__super__.constructor.apply(this, arguments);
      this.fields = {
        DTSTAMP: this.formatIcalDate(date) + 'Z',
        SUMMARY: summary,
        UID: uid
      };
      if (description != null) {
        this.fields.DESCRIPTION = description;
      }
    }

    VTodo.prototype.addAlarm = function(date) {
      return this.add(new VAlarm(date));
    };

    return VTodo;

  })(VComponent);

  module.exports.VEvent = VEvent = (function(_super) {
    __extends(VEvent, _super);

    VEvent.prototype.name = 'VEVENT';

    function VEvent(startDate, endDate, summary, location, uid, description) {
      VEvent.__super__.constructor.apply(this, arguments);
      this.fields = {
        SUMMARY: summary,
        "DTSTART;VALUE=DATE-TIME": this.formatIcalDate(startDate) + 'Z',
        "DTEND;VALUE=DATE-TIME": this.formatIcalDate(endDate) + 'Z',
        LOCATION: location,
        UID: uid
      };
      if (description != null) {
        this.fields.DESCRIPTION = description;
      }
    }

    return VEvent;

  })(VComponent);

  formatUTCOffset = function(startDate, timezone) {
    var diff;
    if ((timezone != null) && (startDate != null)) {
      startDate.setTimezone(timezone);
      diff = startDate.getTimezoneOffset() / 6;
      if (diff === 0) {
        diff = "+0000";
      } else {
        if (diff < 0) {
          diff = diff.toString();
          diff = diff.concat('0');
          if (diff.length === 4) {
            diff = '-0' + diff.substring(1, 4);
          }
        } else {
          diff = diff.toString();
          diff = diff.concat('0');
          if (diff.length === 3) {
            diff = '+0' + diff.substring(0, 3);
          } else {
            diff = '+' + diff.substring(0, 4);
          }
        }
      }
      return diff;
    }
  };

  module.exports.VTimezone = VTimezone = (function(_super) {
    __extends(VTimezone, _super);

    VTimezone.prototype.name = 'VTIMEZONE';

    function VTimezone(startDate, timezone) {
      var diff, vdaylight, vstandard;
      VTimezone.__super__.constructor.apply(this, arguments);
      this.fields = {
        TZID: timezone,
        TZURL: "http://tzurl.org/zoneinfo/" + timezone + ".ics"
      };
      diff = formatUTCOffset(startDate, timezone);
      vstandard = new VStandard(startDate, diff, diff);
      this.add(vstandard);
      vdaylight = new VDaylight(startDate, diff, diff);
      this.add(vdaylight);
    }

    return VTimezone;

  })(VComponent);

  module.exports.VJournal = VJournal = (function(_super) {
    __extends(VJournal, _super);

    function VJournal() {
      _ref = VJournal.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    VJournal.prototype.name = 'VJOURNAL';

    return VJournal;

  })(VComponent);

  module.exports.VFreeBusy = VFreeBusy = (function(_super) {
    __extends(VFreeBusy, _super);

    function VFreeBusy() {
      _ref1 = VFreeBusy.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    VFreeBusy.prototype.name = 'VFREEBUSY';

    return VFreeBusy;

  })(VComponent);

  module.exports.VStandard = VStandard = (function(_super) {
    __extends(VStandard, _super);

    VStandard.prototype.name = 'STANDARD';

    function VStandard(startDate, startShift, endShift) {
      VStandard.__super__.constructor.apply(this, arguments);
      this.fields = {
        DTSTART: this.formatIcalDate(startDate),
        TZOFFSETFROM: startShift,
        TZOFFSETTO: endShift
      };
    }

    return VStandard;

  })(VComponent);

  module.exports.VDaylight = VDaylight = (function(_super) {
    __extends(VDaylight, _super);

    VDaylight.prototype.name = 'DAYLIGHT';

    function VDaylight(startDate, startShift, endShift) {
      VDaylight.__super__.constructor.apply(this, arguments);
      this.fields = {
        DTSTART: this.formatIcalDate(startDate),
        TZOFFSETFROM: startShift,
        TZOFFSETTO: endShift
      };
    }

    return VDaylight;

  })(VComponent);

  module.exports.ICalParser = ICalParser = (function() {
    function ICalParser() {}

    ICalParser.components = {
      VTODO: VTodo,
      VALARM: VAlarm,
      VEVENT: VEvent,
      VJOURNAL: VJournal,
      VFREEBUSY: VFreeBusy,
      VTIMEZONE: VTimezone,
      STANDARD: VStandard,
      DAYLIGHT: VDaylight
    };

    ICalParser.prototype.parseFile = function(file, callback) {
      return this.parse(fs.createReadStream(file), callback);
    };

    ICalParser.prototype.parseString = function(string, callback) {
      var FakeStream, fakeStream, _ref2;
      FakeStream = (function(_super) {
        __extends(FakeStream, _super);

        function FakeStream() {
          _ref2 = FakeStream.__super__.constructor.apply(this, arguments);
          return _ref2;
        }

        FakeStream.prototype.readable = true;

        FakeStream.prototype.writable = false;

        FakeStream.prototype.setEncoding = function() {
          throw 'not implemented';
        };

        FakeStream.prototype.pipe = function() {
          throw 'not implemented';
        };

        FakeStream.prototype.destroy = function() {};

        FakeStream.prototype.resume = function() {};

        FakeStream.prototype.pause = function() {};

        FakeStream.prototype.send = function(string) {
          this.emit('data', string);
          return this.emit('end');
        };

        return FakeStream;

      })(require('events').EventEmitter);
      fakeStream = new FakeStream;
      this.parse(fakeStream, callback);
      return fakeStream.send(string);
    };

    ICalParser.prototype.parse = function(stream, callback) {
      var completeLine, component, createComponent, lineNumber, lineParser, noerror, parent, result, sendError;
      result = {};
      noerror = true;
      lineNumber = 0;
      component = null;
      parent = null;
      completeLine = null;
      stream.on('end', function() {
        if (completeLine) {
          lineParser(completeLine);
        }
        if (noerror) {
          return callback(null, result);
        }
      });
      sendError = function(msg) {
        if (noerror) {
          callback(new Error("" + msg + " (line " + lineNumber + ")"));
        }
        return noerror = false;
      };
      createComponent = function(name) {
        parent = component;
        if (name === "VCALENDAR") {
          if (result.fields != null) {
            sendError("Cannot import more than one calendar");
          }
          component = new VCalendar();
          result = component;
        } else if (__indexOf.call(Object.keys(ICalParser.components), name) >= 0) {
          component = new ICalParser.components[name]();
        } else {
          sendError("Malformed ical file");
        }
        if (component != null) {
          component.parent = parent;
        }
        return parent != null ? parent.add(component) : void 0;
      };
      lineParser = function(line) {
        var detail, details, key, pname, pvalue, tuple, value, _i, _len, _ref2, _ref3, _results;
        lineNumber++;
        tuple = line.trim().split(':');
        if (tuple.length < 2) {
          return sendError("Malformed ical file");
        } else {
          key = tuple[0];
          tuple.shift();
          value = tuple.join('');
          if (key === "BEGIN") {
            return createComponent(value);
          } else if (key === "END") {
            return component = component.parent;
          } else if (!((component != null) || (result != null))) {
            return sendError("Malformed ical file");
          } else if ((key != null) && key !== '' && (component != null)) {
            _ref2 = key.split(';'), key = _ref2[0], details = 2 <= _ref2.length ? __slice.call(_ref2, 1) : [];
            component.fields[key] = value;
            _results = [];
            for (_i = 0, _len = details.length; _i < _len; _i++) {
              detail = details[_i];
              _ref3 = detail.split('='), pname = _ref3[0], pvalue = _ref3[1];
              _results.push(component.fields["" + key + "-" + pname] = pvalue);
            }
            return _results;
          } else {
            return sendError("Malformed ical file");
          }
        }
      };
      return lazy(stream).lines.forEach(function(line) {
        line = line.toString('utf-8').replace("\r", '');
        if (line[0] === ' ') {
          return completeLine += line.substring(1);
        } else {
          if (completeLine) {
            lineParser(completeLine);
          }
          return completeLine = line;
        }
      });
    };

    return ICalParser;

  })();

}).call(this);
