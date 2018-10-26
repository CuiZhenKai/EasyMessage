//导入express框架
var express = require("express");
//初始化express
var app = express();

//导入router
var router = require('./router/router.js');

//使用session
var session = require("express-session");

//这样的app中间件尽量在app.js中使用
app.use(session({
    secret:'keyboard cat',
    resave:false,
    saveUninitialized:true
}));

//设置ejs模板引擎
app.set("view engine","ejs");

//开启静态服务
//样式表 js效果静态服务
app.use(express.static("./public"));
//头像文件的静态服务
app.use("/avatar",express.static("./avatar"));

//进行路由表的配置
//我们将路由后的操作全部交给router暴露出来的接口作
//显示首页
app.get("/",router.showIndex);
//注册页面
app.get("/regist",router.showRegist);
//进行注册业务的处理
app.post("/doregist",router.doRegist);
//显示登录页面
app.get("/login",router.showLogin);
//进行登录业务的处理
app.post("/dologin",router.doLogin);
//显示更改图像页面
app.get("/setavatar",router.showSetAvatar);
//进行图片裁剪业务的处理
app.post("/dosetavatar",router.doSetAvatar);
//显示裁切的页面
app.get("/cut",router.showCut);
//进行裁切
app.get("/docut",router.doCut);
//处理发表说说的业务
app.post("/postmessage",router.postMessage);
//使用ajax列出全部的说说
app.get("/getAllMesaage",router.getAllMesaage);
//根据用户的用户名得到其详细的信息
app.get("/getuserinfo",router.getUserInfo);
//得到所有说说的总数
app.get("/getmessagecouunt",router.getMessageCount);
//显示用户的所有说说
app.get("/user/:user",router.showUser);
//显示所有用户列表
app.get("/userlist",router.showuserlist);  


//监听3000端口,服务器开启服务
app.listen(3000);