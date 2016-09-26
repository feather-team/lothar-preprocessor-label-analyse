'use strict';

var REG = /<!--(?:(?!\[if [^\]]+\]>)[\s\S])*?-->|\{\{--[\s\S]*?--\}\}|@(extends|widget|pagelet)\s*\(['"]([^'"]+)['"]/g;
var Path = require('path');

function getId(id, noSuffix){
    var SUFFIX = '.' + feather.config.get('template.suffix'), REG = new RegExp(SUFFIX.replace(/\./, '\\\\.') + '$', 'gi');
    return id.replace(SUFFIX, '') + (noSuffix ? '' : SUFFIX);
}

module.exports = function(content, file){
    return content.replace(REG, function(all, refType, id){
        if(refType){
            var pid, namespace = '';

            if(refType == 'pagelet'){
                id = id.split('#');

                if(id[1]){
                    pid = id[1];
                }
                
                id = id[0];
            }

            id = getId(id).split(':');

            if(id.length > 1){
                namespace = id[0] + ':';
                id = id[1];
            }else{
                id = id[0];
            }

            if(id[0] == '.'){
                id = Path.join(Path.dirname(file.subpath), id).replace(/^\/+/, '');
            }else if(refType != 'extends'){
                id = refType + '/' + id;

            }

            id = namespace + id;

            var info = feather.project.lookup(id);
            var refFile = info.file;

            if(refFile && refFile.isFile()){ 
                if(!file.extras[refType]){
                    file.extras[refType] = [refFile.id];
                }else{
                    file.extras[refType].push(refFile.id);
                }

                id = getId(refFile.id, true);

                if(pid && refType == 'pagelet'){
                    id += '#' + pid;
                }

                if(refType == 'extends'){
                    id = id.replace(':', '/');
                }else{
                    id = id.replace(':' + refType + '/', ':');
                }

                return '@' + refType + "('" + id + "'"
            }
        }

        return all;
    });
};