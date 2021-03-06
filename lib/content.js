var lodash = require('lodash');
var urlParser = require('./url-parser');

var mediaTypeRe = /^\s*([^;]+)/i;
var compareJSON = require('json-structure-validator');

function getMediaType( contentType ) {
    return contentType.match( mediaTypeRe )[0].toLowerCase();
}

function getMediaTypeFromSpecReq( specReq ) {
    if( specReq && specReq.headers ) {
        for( var i = 0; i < specReq.headers.length; i++ ) {
            if(/content\-type/i.test( specReq.headers[i].name )) {
                return getMediaType( specReq.headers[i].value );
            }
        }
    }
    return null;
}

function getMediaTypeFromHttpReq( httpReq ) {
    if( 'content-type' in httpReq.headers ) {
        return getMediaType( httpReq.headers['content-type'] );
    }
    return null;
}

function isBodyEqual( httpReq, specReq, contentType ) {
    if (!specReq && !httpReq.body){
        return true;
    }

    if (httpReq.body === specReq.body){
        return true;
    }

    if (/application\/x-www-form-urlencoded/i.test(contentType)) {
        var jsonEncodedSpecBody = JSON.parse(specReq.body);
        return urlParser.jsonToFormEncodedString(jsonEncodedSpecBody) === httpReq.body;
    }

    if (/json/i.test(contentType)){
        if(true == compareJSON(JSON.parse(specReq.body), JSON.parse(httpReq.body))) {
            return true;
        } else {
            return false;
        }
    }

    return false;
}

function hasHeaders( httpReq, specReq ){
    if (!specReq || !specReq.headers){
        return true;
    }

    function containsHeader( header ){
        var httpReqHeader = header.name.toLowerCase();

        if(header.name === 'Content-Type'){
            return true;
        }

        if(!httpReq.headers.hasOwnProperty( httpReqHeader ) || httpReq.headers[httpReqHeader] !== header.value){
            return false;
        }

        return true;
    }

    return specReq.headers.every(containsHeader);
}

exports.matches = function( httpReq, specReq ) {
    var httpMediaType = getMediaTypeFromHttpReq( httpReq );
    var specMediaType = getMediaTypeFromSpecReq( specReq );
    if ( httpMediaType === specMediaType ) {
        if ( !hasHeaders( httpReq, specReq ) ){
            return false;
        }

        if ( isBodyEqual( httpReq, specReq, httpMediaType ) ) {
            return true;
        } else {
            return false;
        }

    } else {
        return false;
    }
};
