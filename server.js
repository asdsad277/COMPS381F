const express = require('express');
const app = express();
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const session = require('cookie-session');
const bodyParser = require('body-parser');
const dbName='project';
const mongourl = 'mongodb+srv://s1253745:ccgss123@cluster0.diyj2.mongodb.net/test?retryWrites=true&w=majority';
const formidable = require('express-formidable');
const secretkey="this is just too new for me to learn";

// all the function related to database
//not yet finish (maybe finished?)
const handle_Find = (ac,res,crit) => {
    const client = new MongoClient(mongourl);
    client.connect((err) => {
        assert.equal(null, err);
        console.log("Connected successfully to server(handle_find)");
        const db = client.db(dbName);
        if(crit==null){
            var cursor = db.collection("restaurant").find();
        }else{
            var cursor = db.collection("restaurant").find(crit);
        }
        cursor.toArray((err,docs) => {
            assert.equal(err,null);
            console.log("this is crit"+crit);
            console.log(`findDocument: ${docs.length}`);
            res.render('search',{user:ac,numofr:docs.length,crit:crit,c:docs})
        });     
    });
}
//--------------------login (99%)----------------------
const login_user = (req,res,crit) =>{
    const client = new MongoClient(mongourl);
    client.connect((err) => {
        assert.equal(null, err);
        console.log("Connected successfully to server(login_user)");
        const db = client.db(dbName);
        db.collection('account').findOne(crit,(err,result)=>{
            if (result==null){
                client.close();           
                res.render('info',{tname:"login failure!",reason:"No such user(wrong password or username?)"})
            }else{
                client.close();
                req.session.logined = true;
                req.session.userac = req.body.acc;
                handle_Find(req.session.userac,res,"");
                //maybe fixed? but url is not same as demo one
            }
        });
    });
}
//---------------------register (100%)-------------------------------
const reg_user = (res,crit) =>{
    const client = new MongoClient(mongourl);
    client.connect((err) => {
        assert.equal(null, err);
        console.log("Connected successfully to server(reg_user)");
        const db = client.db(dbName);
        db.collection('account').findOne(crit,(err,result)=>{
            if (result==null){
                db.collection('account').insertOne(crit,(err,result)=>{
                    if (err) {console.log(err);}
                    else{
                        client.close();
                        console.log("Closed DB connection\nregister success!");
                        res.render('info',{tname:"register success!",reason:"you have register a new ac successfully!"})
                    }            
                });               
            }else{
                client.close();
                console.log("Closed DB connection");
                res.render('info',{tname:"register fail!",reason:"you have fail to register a new ac!(properly have the same account)"})
            }
        })
         
    });
}
//create restaurant
const create_restaurant=(req, res, crit, ac)=>{
    var doc={};
    doc['owner'] = ac;
    doc['name'] = req.fields.name;
    doc['borough'] = req.fields.borough;
    doc['cuisine'] = req.fields.cuisine;
    doc['address'] = {
        'street': req.fields.street,
        'zipcode': req.fields.zipcode,
        'building': req.fields.building,
        'coord': { 'lat': req.fields.lat, 
                   'lon': req.fields.lon }
    };
    if (req.files.filetoupload.size > 0) {
        fs.readFile(req.files.filetoupload.path, (err, data) => {
            if(err){console.log(err);}
            doc['photo'] = new Buffer.from(data).toString('base64');
        });
    }
    const client = new MongoClient(mongourl);
    client.connect((err)=>{
        assert.equal(null,err);
        console.log("Connected successfully to server(Create restarant)");
        const db = client.db(dbName);
        db.collection("restaurant").insertOne(crit,(err, results)=>{
                client.close();
                if(err){console.log(err);}
                res.render('info',{tname:"Create success!",reason:"you have create a new restaurant successfully!"})
            }
        );
    });
}
//end of functions
app.set('view engine','ejs');

// support parsing of application/json type post data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
/*start login session
    userac:string
    logined:boolean
*/
app.use(session({
    name: 'loginsession',
    keys: secretkey,
}));

//default routing
app.get('/',(req,res)=>{
    if(!req.session.logined){
        res.redirect('/login');
    }else{
        res.redirect('/search')
    }
})
// register new user on the system
app.get('/register',(req,res)=>{
    res.status(200).render('register',{});
})
app.post(('/register'),(req,res)=>{
    reg_user(res,req.body)
})
//login user
app.get('/login',(req,res) => {
    res.status(200).render('login',{});
});
// receive user logined action
app.post('/login', (req,res) => {+
    login_user(req,res,req.body)  
})
// search function?
app.get('/search',(req,res) => {
    console.log('going search');
    handle_Find(req.session.userac,res,req.query);
    
});
// logout
app.get('/logout', function(req,res) {
    req.session = null;
    res.redirect('/');
});
//create new restaurant
app.get('/create',(req,res) => {
    res.status(200).render('create',{});
});
// receive restaurant info
app.post('/create', formidable(), (req,res) => {
      create_restaurant(req,res.query,req.session.userac);
})
//restaurant detail
app.get('/restaurant',(req,res) => {
    console.log('going restaurant');
    res.end('in progress!');
    //res.status(200).render('restaurant',{});
});
//Q8 api 
app.get('/api/restaurant/:para/:crit',(req,res)=>{
    //res.type('json');
    switch(req.params.para){
        case "name":
        
        break;
        case "borough":

        break;
        case "cuisine":
            
        break;
        default:
            res.render('info',{tname:"nothing input?",reason:"you have not input a single thing?"});
            console.log('there is nothing inputed?');
        break;
    }
})

app.listen(process.env.PORT || 8099);
//res.render('info',{tname:"",reason:""})