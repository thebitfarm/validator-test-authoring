var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');
var app = express();

// json, xml, text, form body parsers
app.use(bodyParser.text({limit: '10mb', type: 'text/*'}));
app.use(bodyParser.text({limit: '10mb', type: 'application/xml'}));
app.use(bodyParser.json({limit: '10mb', type: 'application/json'}));
app.use(bodyParser.json({limit: '10mb', type: '*/*+json'})); // handle custom content types that end in +json
app.use(bodyParser.text({limit: '10mb', type: '*/*+xml'}));  // handle custom content types that end in +xml
app.use(bodyParser.urlencoded({extended: false}));  // form data - false = querystring library, true(default) = qs library which was deprecated
app.use(bodyParser.text({defaultCharset: 'utf-8'}));


var port = 3000;
var arr = [];

if (process.argv.length > 2) {
    port = process.argv[2];
}

app.all('/*', function (req, res) {
    var obj = {};
    var urlObj = {};
    var respCode = 200;  // default response code

    // optional configuration object for post/put
    // if the configuration is not used, defaults will be used when a post/put is done
    // with just payload data to be returned by a get
    /*
    // all data members are optional
    {
        "wsListenerConfig": {
            "respData":"response data to be sent back in a GET to this url",
            "respCode":"http return code to be sent back in a GET. e.g. 201",
            "headers": {
                "accept":"content type for the response data for both post/put and get",
                "authorization":"Basic <base64 string of username:password>" which will be compared
                    to the authorization header on subsequent post/put and get requests.  If it doesn't
                    compare, a 401 will be returned.
            },
            "postRespData":"data to be returned on subsequent put/post to this url",
            "postRespCode":"http return code to be sent on subseq put/post to this url. e.g. 201",
            "delRespCode":"http return code to be sent on subseq delete to this url. e.g. 204"
        }
    }

    EXAMPLE:
    {
         "wsListenerConfig": {
             "respData":"{\"taco\":\"time\"}",
             "respCode":"201",
             "headers": {
                 "accept":"application/json",
                 "authorization":"Basic abc123"
             },
             "postRespData":"{\"posttaco\":\"posttime\"}",
             "postRespCode":"202",
             "delRespCode":"204"
         }
    }
    */

    //handle put and post
    if (req.method.toLowerCase() === "put" ||
            req.method.toLowerCase() === "post") {

        // check if configuration object was received
        var configobj;
        if (req.body.wsListenerConfig) {
            configobj = req.body.wsListenerConfig;
        }

        // set respData from the request body as a string (not as a JSON object)
        var bodyAsString = "";
        try {
            bodyAsString = JSON.stringify(req.body);
            // if the body is not json, assign req.body
            if (!bodyAsString.startsWith("[") && !bodyAsString.startsWith("{")) {
                bodyAsString = req.body;
            }
        } catch (ex) {
            bodyAsString = req.body;
        }

        // search for an existing object with the url
        obj = {
            "method": "get",
            "url": req.url
        };
        urlObj = _.findWhere(arr, obj);
        //if the url already exists and there no config object was received
        if (urlObj && !configobj) {
            // check authorization header for match to configuration
            if (urlObj.headers && urlObj.headers.authorization) {
                if (urlObj.headers.authorization !== req.headers['authorization']) {
                    res.sendStatus(401);
                    return;
                }
            }

            urlObj.respData = bodyAsString;

            // set content type and post return data and code if it exists
            if (urlObj.headers && urlObj.headers.accept) {
                res.set('Content-Type', urlObj.headers.accept);
            }
            respCode = urlObj.postRespCode || respCode;
            if (urlObj.postRespData) {
                res.status(respCode).send(urlObj.postRespData);
            } else {
                res.sendStatus(respCode);
            }
            return;
        }

        // if url already exists
        if (urlObj) {
            obj = urlObj;  // copy the reference to the object found
        }

        // use config data to set object data, if not there, use existing data or undefined
        if (configobj) {
            obj.respData = configobj.respData || obj.respData;
            obj.respCode = configobj.respCode || respCode;
            obj.headers = configobj.headers || undefined;
            obj.reqDataType = configobj.reqDataType || undefined;
            obj.postRespData = configobj.postRespData || undefined;
            obj.postRespCode = configobj.postRespCode || undefined;
            obj.delRespCode = configobj.delRespCode || undefined;
        // otherwise the request body is the response data
        } else {
            obj.respData = bodyAsString;
        }

        // save if it is a new url
        if (!urlObj) {
            arr.push(obj);
        }
        res.sendStatus(respCode);
        return;
    }

    //handle delete of a url
    if (req.method.toLowerCase() === "delete") {
        //if delete remove get if exists
        obj = {
            "method": "get",
            "url": req.url
        };

        // search for an existing object with the url
        urlObj = _.findWhere(arr, obj);
        if (urlObj) {
            respCode = urlObj.delRespCode || 200;
            arr.splice(_.indexOf(arr, urlObj), 1);
            res.sendStatus(respCode);
            return;
        }
        res.send("DELETE failed because GET endpoint not found!  " + "Method: " + req.method + " URL: " + req.url);
        return;
    }

    // handle shutdown
    if (req.method.toLowerCase() === "get" && req.url.toLowerCase() === "/shutdown") {
        res.sendStatus(respCode);
        process.exit(0);
    }

    // handle connection test
    if (req.method.toLowerCase() === "get" && req.url.toLowerCase() === "/wsconntest") {
        res.sendStatus(respCode);
        return;
    }

    // handle output all current endpoint configuration
    if (req.method.toLowerCase() === "get" && req.url.toLowerCase() === "/wslist") {
        res.send(arr);
        return;
    }

    // handle get
    obj = {
        "method": req.method.toLowerCase(),
        "url": req.url
    };

    // search for an existing object with the url
    urlObj = _.findWhere(arr, obj);
    if (urlObj) {
        // check authorization header for match to configuration
        if (urlObj.headers && urlObj.headers.authorization) {
            if (urlObj.headers.authorization !== req.headers['authorization']) {
                res.sendStatus(401);
                return;
            }
        }
        // set content type (if it existss) and return data and code
        if (urlObj.headers && urlObj.headers.accept) {
            res.set('Content-Type', urlObj.headers.accept);
        }
        respCode = urlObj.respCode || respCode;
        res.status(respCode).send(urlObj.respData);
        return;
    }
    res.send("URL/Method not found!  " + "Method: " + req.method + " URL: " + req.url);
});

var server = app.listen(port, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log("Validator test REST Service listening at http://%s:%s", host, port);
});
