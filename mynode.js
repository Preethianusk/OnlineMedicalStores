const express=require('express');
const path=require('path');
const session=require('express-session');
const bodyParser = require('body-parser');

const app=express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session({secret:'your_secret_key', resave:true, saveUninitialized:true}));

app.use(express.static(path.join(__dirname, 'css folder')));
app.use(express.static(path.join(__dirname, 'img folder')));
app.use(express.static(path.join(__dirname, 'js folder')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const mongoose=require('mongoose')
const parser=require('body-parser');
const { count } = require('console');

const url="mongodb://localhost:27017/UserDB";

const Schema=mongoose.Schema;

app.use(parser.urlencoded({extended:true}))



mongoose.connect(url).then((result)=>
{
    console.log("Connected Successfully..");
}).catch((error)=>
{
    console.log("Error");
});


var UserSchema = new Schema({
    name:String,
    email:String,
    date:String,
    gender:String,
    loginid:String,
    password:String
});

var UserModel = mongoose.model('User',UserSchema);



app.get('/signup_page',function(req,res)
{
    res.sendFile(path.join(__dirname,".","signup_page.html"));
});


app.get('/',function(req,res)
{
    req.session.username='unKnown';

    res.sendFile(path.join(__dirname,".","login_page.html"));
});


app.get('/login_page',function(req,res)
{
    res.sendFile(path.join(__dirname,".","login_page.html"));
});



app.get('/val_signup',async function(req,res)
{
    async function insDocFunc()
    {
        let name = req.query['fullname'];
        let email = req.query['email'];
        let date = req.query['date'];
        let gender = req.query['gender'];
        let loginid = req.query['loginid'];
        let password = req.query['password'];
        
        let record=await UserModel.find({},{__v:0});

        let flag=0;

        for(i in record)
        {
            if(loginid === String(record[i].loginid))
            {
                flag=1;
                break;
            }
        }

        if(flag==1)
        {
            res.send("<script>alert('LoginID already Exists...'); window.location='/signup_page';</script>"); 
        }

        else 
        {
            let UserDocument = new UserModel(
                {
                    name:name,
                    email:email,
                    date:date,
                    gender:gender,
                    loginid:loginid,
                    password:password
                }
            );

            let result = await UserDocument.save();

            res.send("<script>alert('Sign-up Successful...'); window.location='/login_page';</script>");
        }
    }

    insDocFunc();
});



app.get('/val_login',async function(req,res)
{
    async function checkFunc()
    {

        let loginid = req.query['loginid'];
        let password = req.query['password'];
        
        let record=await UserModel.find({},{__v:0});

        let flag=0,temp=0;

        for(i in record)
        {
            if(loginid === String(record[i].loginid))
            {
                if(password === String(record[i].password))
                {  
                    flag=1;
                    break;
                }
                else 
                {
                    temp=1;
                    break;
                }
            }
        }

        if(flag==1)
        {
            req.session.username=loginid;
            res.send("<script> window.location='/Home'; </script>"); 
        }

        else if(temp==1)
        {
            res.send("<script>alert('Invalid Password...'); window.location='/login_page';</script>"); 
        }

        else 
        {
            res.send("<script>alert('Invalid User account...'); window.location='/login_page';</script>");
        }
    }

    checkFunc();
});



app.get('/Home',function(req,res)
{
    res.render('Home', { username: req.session.username });
});






var MedicineSchema = new Schema({
    name:String,
    price:Number
});

var MedicineModel = mongoose.model('Medicine',MedicineSchema);


app.get('/Medicine',async function(req,res)
{
    const medicine_names=[];
    const medicine_prices=[];

    let record="";

    async function getFunc()
    {
        
        record=await MedicineModel.find({},{__v:0});
        
        for(i in record)
        {
            medicine_names.push(record[i].name);
            medicine_prices.push(record[i].price);
        }

        res.render('Medicine', {
            username: req.session.username,
            medicine_names: medicine_names,
            medicine_prices: medicine_prices
        });
    }

    getFunc();

});








var CartSchema = new Schema({
    username:String,
    name:String,
    unit_price:Number
});

var CartModel = mongoose.model('Cart',CartSchema);


app.get('/inscart',async function(req,res)
{
    const newName = req.query['medicineName'];
    const newPrice = req.query['price'];

    console.log(newName);

    async function insDocFunc()
    {
        if(newName!=="")
        {
            let CartDocument = new CartModel(
                {
                    username:req.session.username,
                    name:newName,
                    unit_price:newPrice
                }
            );
    
            let result = await CartDocument.save();
        }
    }

    insDocFunc();

    res.send("<script> window.location='/cart'; </script>"); 

});



app.get('/cart', async function(req, res) 
{
    let record="";

    const username=req.session.username;

    async function getFunc()
    {
        req.session.name_arr = [];
        req.session.price_arr = [];

        record=await CartModel.find({},{__v:0});
        
        for(i in record)
        {
            if(username === String(record[i].username))
            {
                req.session.name_arr.push(record[i].name);
                req.session.price_arr.push(record[i].unit_price);
            }
        }

        res.render('cart', {
            username: req.session.username,
            name_arr:req.session.name_arr,
            price_arr:req.session.price_arr
        });
    }

    getFunc();

});


app.get('/checkout', function(req, res) {
    const { products, subtotal, taxes, shipping, total } = req.query;

    req.session.products=products;
    req.session.total=total;

    res.send("<script> window.location='/order_page'; </script>"); 
    
});




app.get('/order_page', function(req, res) {

    res.render('order_page', {
        username: req.session.username,
        products: req.session.products,
        total:req.session.total
    });

});



var OrderSchema = new Schema({
    username:String,
    name:String,
    email:String,
    address:String,
    country:String,
    postalCode:String,
    phoneNumber:String,
    products:Array,
    quantities:Array,
    prices:Array,
    total:String
});

var OrderModel = mongoose.model('Order',OrderSchema);

app.post('/order_placed', async function(req, res) 
{
    
    async function insDocFunc()
    {
        const { name, email, address, optional, country, postalCode, phoneNumber, products, quantities, prices, total } = req.body;
 
        
            let OrderDocument = new OrderModel(
                {
                    username:req.session.username,
                    name:name,
                    email:email,
                    address:address,
                    country:country,
                    postalCode:postalCode,
                    phoneNumber:phoneNumber,
                    products:products,
                    quantities:quantities,
                    prices:prices,
                    total:total
                }
            );

            let result = await OrderDocument.save();

    }

    insDocFunc();
    
    res.render('order_placed', {
        username: req.session.username
    });
});



app.get('/HealthCare',function(req,res)
{
    res.render('HealthCare', { username: req.session.username });
});



app.get('/PersonalCare',function(req,res)
{
    res.render('PersonalCare', { username: req.session.username });
});



app.get('/HomeCare',function(req,res)
{
    res.render('HomeCare', { username: req.session.username });
});



app.get('/Vaccination',function(req,res)
{
    res.render('Vaccination', { username: req.session.username });
});



app.get('/Offer',function(req,res)
{
    res.render('Offer', { username: req.session.username });
});



app.get('/Contact',function(req,res)
{
    res.render('Contact', { username: req.session.username });
});




app.get('/update_profile', async function(req, res) 
{
    let record="";

    const username=req.session.username;

    async function getFunc()
    {
        req.session.name_arr = [];
        req.session.price_arr = [];

        var name = "";
        var email ="";
        var date ="";
        var gender="";
        var password="";

        record=await UserModel.find({},{__v:0});
        
        for(i in record)
        {
            if(username === String(record[i].loginid))
            {
                name=record[i].name;
                email=record[i].email;
                date=record[i].date;
                gender=record[i].gender;
                password=record[i].password;
            }
        }


        res.render('update_profile', { username: req.session.username,
        name:name,
        email: email,
        date:date,
        gender:gender,
        password:password
        });

    }

    getFunc();

});




app.get('/update', async function(req, res) {

    const { fullname, email, date, gender, password } = req.query;

    await UserModel.updateOne({loginid:req.session.username}, 
    {$set: {name:fullname, email:email, date:date, gender:gender, password:password}});

    res.send("<script> alert('Updated Successfully...'); window.location='/Home'; </script>"); 
});


app.get('/removeMedicine', async function(req, res) {
    var productNameToRemove = req.query.productName;
    console.log(productNameToRemove);
    await CartModel.deleteOne({name:productNameToRemove}); 

    res.send("<script> window.location='/cart'; </script>"); 
});



app.listen(3000);