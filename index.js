'use strict';

var REG = /<!--(?:(?!\[if [^\]]+\]>)[\s\S])*?-->|\{\{--[\s\S]*?--\}\}|@(extends|widget|pagelet)\s*\(['"]([^'"]+)['"]/g;
var Path = require('path');

function getId(id, noSuffix){
    var SUFFIX = '.' + feather.config.get('template.suffix');
    return id.replace(SUFFIX, '') + (noSuffix ? '' : SUFFIX);
}

module.exports = function(content, file){
    if(!file.isHtmlLike){
        return content;
    }

    content = content.replace(REG, function(all, refType, id){
        if(refType){
            var pid, namespace = '';

            if(refType == 'pagelet'){
                id = id.split('#');

                if(id[1]){
                    pid = id[1];
                }
                
                id = id[0];
            }

            id = getId(id, true).split(':');

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

            id = id.replace(/\./g, '/');
            id = namespace + id + '.' + feather.config.get('template.suffix');

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

    //如果是pagelet，由于blade的extends非真正继承的原因，导致extends的内容会直接插入至页面的底部，导致无法被textarea包裹
    //所以先将其直接放置底部，并且换成include解析
    if(file.isPagelet){
        var start = content.indexOf('@extends(');

        if(start > -1){
            var index = start + 9, k = 1, chr;

            while(chr = content[index++]){
                if(chr == ')'){
                    --k;
                }else if(chr == '('){
                    ++k;
                }

                if(!k){ 
                    content = content.substring(0, start) + ' ' + content.substring(index) + ' ' + content.substring(start, index).replace('@extends(', '@include(');
                    break;
                }
            }
        }
    }

    return content.replace(/\s@\w+/g, '<<<BLADE_LABEL_HACK>>>$&');
};