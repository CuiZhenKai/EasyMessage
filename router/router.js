//集合app.js中的路由,对应的进行相关的操作

//引入formidable包
//这个包的作用是处理关于用户提交上来的表单的
var formidable = require('formidable');

//引入底层的DAO层(自己封装的垃圾db数据库模型)
var db = require("../models/db.js");
//将用户输入的用户密码,进行md5二次加密
var md5 = require("../models/md5.js");

//引入path包,在头像上传的时候进行使用
var path = require("path");
//引入fs包
var fs = require("fs");
//引入gm包,进行图像的裁切
var gm = require('gm');

//暴露的接口1:显示默认首页 "/" get
exports.showIndex = function (req,res,next){
    //检索数据库，查找此人的头像
    if (req.session.login == "1") {
        //如果登陆了
        var username = req.session.username;
        var login = true;
    } else {
        //没有登陆
        var username = "";  //制定一个空用户名
        var login = false;
    }
    //已经登陆了，那么就要检索数据库，查登陆这个人的头像
    db.find("users", {username: username}, function (err, result) {
        if (result.length == 0) {
            var avatar = "moren.jpg";
        } else {
            var avatar = result[0].avatar;
        }
        res.render("index", {
            "login": login,
            "username": username,
            "active": "index",
            "avatar": avatar
        });
    });
}

//暴露的接口2:显示注册页面 "/regist" get
exports.showRegist = function (req,res,next){
    //显示注册页面
    res.render("regist",{
        "login":req.session.login == "1"?true :false,
        "username":req.session.login == "1"?req.session.username:"",
        "active":"regist"
    });
}

//暴露的接口3:进行注册业务的处理  "/doregist" post
exports.doRegist = function (req,res,next){

    //我们在这里进行注册业务的处理
    //业务逻辑一般分为三个步骤:
    //1.得到用户填写的东西
    //2.根据用户填写的东西去数据库中查找是否已经存在这个人
    //3.保存这个人的相关信息

    //初始化一个formidable
    var form = formidable.IncomingForm();

    form.parse(req,function (err,fields,files){
        if(err){
            console.log(err);
        }
        //得到表单之后,也就是得到用户提交后的数据要做的事情
        //用户名
        var username = fields.username;
        var password = fields.password;
        //console.log(username,fields.password);
        //我们得到用户提交的注册表单后,在数据库中进行查询
        //使用数据库中的find方法进行查询
        db.find("users",{"username":username},(err,result)=>{
            //这里面表示的是根据对应的用户名查询后的处理业务
            if(err){
                //注意:res.send()中的东西是给前台的ajax看的
                res.send("-3");
                return;
            }
            if(result.length != 0){
                //表示用户名已经被占用了
                res.send("-1");
                return;
            }
            //进行用户密码的二次加密
            password = md5(md5(password)+"CZK");
            //程序跑到这个地方,证明用户输入的用户名没有重复,我们将其的信息放到数据库,完成用户的注册操作
            db.insertOne("users",{
                "username":username,
                "password":password,
                //在用户注册成功的时候,默认的去给每一个用户增加一个头像
                "avatar":"moren.jpg"
            },(err,result)=>{
                if(err){
                    //注意:res.send()中的东西是给前台的ajax看的
                    res.send("-3");
                    return;
                }
                //注册成功,这时候我们要将用户填写的注册信息写入session
                req.session.login = "1";
                req.session.username = username;
                res.send("1");
            });
        });
    });
}

//暴露的接口4:显示登录页面 "/login" get
exports.showLogin = function (req,res,next){
    //显示登录页面
    res.render("login",{
        "login":req.session.login == "1"?true :false,
        "username":req.session.login == "1"?req.session.username:"",
        "active":"login"
    });
}

//暴露的接口5:进行登录业务的处理 "/dologin" post
exports.doLogin = function (req,res,next){
    
    //我们在这里进行登录页面的处理
    //1.我们需要首先得到用户登录的表单信息
    //2.去查询数据库,看看是否存在此用户
    //3.查询完成之后,进一步查看此用户的登录密码是否正确
    //4.登录

    var form = new formidable.IncomingForm();
    form.parse(req,(err,fields,files)=>{
        var username = fields.username;
        var password = fields.password;
        var md5Pass = md5(md5(password)+"CZK");
        //查询数据库,是否存在用户
        db.find("users",{"username":username},(err,result)=>{
            if(err){
                //来自服务器未知的错误
                res.send("-5");
                return;
            }
            if(result.length == 0){
                //不存在用户
                res.send("-1");
            }
            //此时查询到用户存在,那么进行查询密码的操作
            if(md5Pass == result[0].password){
                //用户名和密码正确后,全部写入session
                req.session.login = "1";
                req.session.username = username;
                res.send("1");
                return;
            }else{
                //用户密码错误
                res.send("-2");
                return;
            }
        });
    });
}

//暴露的接口6:显示更改头像的页面  "/setavatar" get
exports.showSetAvatar = function (req,res,next){
    //设置头像的页面,必须 保证此时用户是登录的状态
    if(req.session.login != 1){
        res.end("不可进入");
        return;
    }
    res.render("setavatar",{
        "login":true,
        "username":req.session.username,
        "active":"changeAvatar"
    });
}

//暴露的接口7:进行头像的裁剪  "/doSetAvatar" post
exports.doSetAvatar = function (req,res,next){
    //初始化一个formidable
    var form = new formidable.IncomingForm();
    //设置上传的文件夹
    form.uploadDir = path.normalize(__dirname+"/../avatar");
    //进行文件的处理
    form.parse(req,(err,fields,files)=>{
        //进行文件的更名
        var oldPath = files.touxiang.path;
        var newPath = path.normalize(__dirname+"/../avatar") + "/" + req.session.username +".jpg";
        fs.rename(oldPath,newPath,(err)=>{
            if(err){
                res.send("失败");
                return;
            }
            //将图片路径存入到缓存中
            req.session.avatar = req.session.username +".jpg";
            //跳转到切的业务
            res.redirect("/cut");
        });
    })
}

//暴露的接口8:显示图像裁切页面  "cut" get
exports.showCut = function (req,res){
    res.render("cut",{
        "avatar":req.session.avatar
    });
}

//暴露的接口9:进行图像的最后的裁切 "docut" get
exports.doCut = function (req,res){
    //五个参数
    var filename = req.session.avatar;
    var w = req.query.w;
    var h = req.query.h;
    var x = req.query.x;
    var y = req.query.y;

    gm("./avatar/"+filename).crop(w,h,x,y).resize(100,100,"!").write("./avatar/"+filename,function (err){
        if(err){
            res.send("-1");
            return;
        }
        //更改数据库当前用户的avatar这个值
        db.updateMany("users", {"username": req.session.username}, {
            $set: {"avatar": req.session.avatar}
        }, function (err, results) {
            res.send("1");
        });
    });
    
}

//暴露的接口10:进行发表说说的操作
exports.postMessage = function (req,res){
    //发表说说的时候必须保证登录
    if(req.session.login !="1"){
        res.send("不可进入");
        return;
    }
    var username = req.session.username;
    var form = new formidable.IncomingForm();
    form.parse(req,(err,fields,files)=>{
        var content = fields.content;

        db.insertOne("posts",{
            "username":username,
            "datatime":new Date(),
            "content":content
        },(err,result)=>{
            if(err){
                //服务器出错
                res.send("-3");
                return;
            }
            res.send("1");
        });
    });
}

//暴露的接口11:列出所有的说说,使用ajax  "getAllMesaage" get
exports.getAllMesaage = function (req,res,next){
    //这个页面接受一个参数,用来分页
    var page = req.query.page;
    db.find("posts",{},{"pageamount":5,"page":page,"sort":{"datatime":-1}},(err,result)=>{
        res.json(result);
    })
};

//暴露的接口12:根据提供的用户名查找出用户的详细信息 "getUserInfo" get
exports.getUserInfo = function (req,res,next){
    //这个页面接收一个参数,即用户名
    var username = req.query.username;
    db.find("users",{"username":username},(err,result)=>{
        //筛选的列出用户的信息,不要筛选出密码
        var obj = {
            "username":result[0].username,
            "avatar":result[0].avatar,
            "_id":result[0]._id
        }
        res.json(obj);
    });
}

//暴露的接口13:得到所有的说说的总数   "getmessagecount"  get
exports.getMessageCount = function (req,res,next){
    db.getAllCount("posts",function (count){
        res.send(count.toString());
    })
}

//暴露的接口14:显示某一个用户的个人主页
exports.showUser = function(req,res,next){
    var user = req.params["user"];
    db.find("posts",{"username":user},function(err,result){
       db.find("users",{"username":user},function(err,result2){
           res.render("user",{
               "login": req.session.login == "1" ? true : false,
               "username": req.session.login == "1" ? req.session.username : "",
               "user" : user,
               "active" : "我的说说",
               "cirenshuoshuo" : result,
               "cirentouxiang" : result2[0].avatar
           });
       });
    });
}

//显示所有注册用户
exports.showuserlist = function(req,res,next){
    db.find("users",{},function(err,result){
        res.render("userlist",{
            "login": req.session.login == "1" ? true : false,
            "username": req.session.login == "1" ? req.session.username : "",
            "active" : "成员列表",
            "suoyouchengyuan" : result
        });
    });
}