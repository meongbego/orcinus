var utils = require("./utils");
var proc = require('process');
var chp = require('child_process');
var val,volumes = {},cmdData = [];
module.exports = {
  init : (value)=>{
    val = value;
    var svc = utils.obj(val);
    if(svc.indexOf('services') <= 0) {
      console.log("Service can't defined.");
      proc.exit(1);
    }
    if(svc.indexOf('volumes') >= 0) {
      module.exports.volumes(val.volumes);
    }
    var app = utils.obj(val.services);
    app.forEach((v)=>{
      module.exports.prs(v);
    });
    cmdData.forEach((v)=>{
      module.exports.execution(v);
    });
  },
  execution : (keyMap)=>{
    var opt = keyMap.opt.join(" ");
    var img = keyMap.img;
    var name = keyMap.name;
    var cmd = "docker service create "+opt+" --name "+name+" "+img;
    chp.exec(cmd,(e, stdout, stderr)=> {
      if(stdout){
        console.log("Service "+keyMap.name+" created");
        console.log(stdout);
      }
      if(stderr){
        console.log(stderr);
        process.exit(0);
      }
    })
  },
  prs : (key)=>{
    var app = val.services[key];
    var image = app.image;
    var opt = module.exports.opt(app);
    var keyMap = {
      opt: opt,
      img: image,
      name: key
    }
    cmdData.push(keyMap);
    //module.exports.execution(keyMap);
  },
  opt : (app)=>{
    var arr = [];
    var cmd = utils.obj(app);
    if(cmd.indexOf("volumes") >= 0){
      app.volumes.forEach((v)=>{
        if(!volumes[v]){
          console.log("Volume data is not exist!");
          process.exit(0);
        }
        arr.push("--mount "+volumes[v]);
      });
    }
    if(cmd.indexOf("ports") >= 0){
      app.ports.forEach((v)=>{
        arr.push("-p "+v);
      });
    }
    if(cmd.indexOf("environment") >= 0){
      app.environment.forEach((v)=>{
        arr.push("--env "+v);
      });
    }
    if(cmd.indexOf("replicas") >= 0){
        arr.push("--replicas "+app.replicas);
    }
    if(cmd.indexOf("cpu") >= 0){
        arr.push("--limit-cpu "+app.cpu);
    }
    if(cmd.indexOf("memory") >= 0){
        arr.push("--limit-memory "+app.memory);
    }
    if(cmd.indexOf("network") >= 0){
        arr.push("--network "+app.network);
    }

    return arr;
  },
  volumes : (data)=>{
    var name = utils.obj(data);
    name.forEach((val,k)=>{
      var v = data[val];
      /* Add volume type */
      if(v.type == "nfs"){
        if(!v.address || !v.source || !v.target){
          console.log("NFS data not valid!");
          process.exit(0);
        }
        volumes[name[k]] = "type=volume,volume-opt=o=addr="+v.address+",volume-opt=device=:"+v.source+",volume-opt=type=nfs,source="+name[k]+",target="+v.target;
      }
    });
  }
}