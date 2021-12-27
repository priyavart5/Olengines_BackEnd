import  Express  from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import bcrypt from 'bcrypt';
import knex from 'knex';
import pool from './db.js';


const db = knex({
    client: 'pg',
    connection: {
      host : '127.0.0.1',
      user : 'priyavartvashisht',
      password : '',
      database : 'olengines_database'
    }
  }); 

const app = Express();
const port= process.env.PORT || 4000;
app.use(bodyParser.json());

app.use(cors());

app.get('/' ,(req,res) => {
    res.send(db.users);
})



app.post('/signin',async (req,res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json('incorrect form submission');
    }
    db.select('email', 'passwordhash').from('signin')
    .where('email','=', email)
    .then(async data => {
        const isValid = bcrypt.compareSync(password, data[0].passwordhash);
        console.log(isValid)
        if(isValid){
            return db.select('*').from('users')
                .where('email', '=', email)
                .then(user => {
                    console.log(user)
                    res.json(user[0])
                })
                .catch (err => res.status(400).json('Unable to get user'))
        }else{
            res.status(400).json('Something went wrong')
        }
    })
    .catch(err => res.status(400).json('Wrong Credentials'))
})


app.post('/signup' ,async (req, res)=>{
    const {name, email, password} = req.body;
    if(!email || !name || !password){
        return res.status(400).json("Incorrect form submission");
    }
    const hashp = await (bcrypt.hash(password,10))
    db.transaction(trx => {
        trx.insert({
            passwordhash: hashp,
            email: email
        })
        .into('signin')
        .returning('email')
        .then(signinEmail => {
            return trx('users')
                .returning('*')
                .insert({
                    name: name,
                    email: signinEmail[0],
                    password: hashp
                })
                .then(user1 => {
                    console.log(user1)
                    res.json(user1[0]);
                })
            })
            .then(trx.commit)
            .catch(trx.rollback)
    }).catch(err => res.status(400).json('Unable to signup'));
})


app.get('/search', async (req, res) => {
    try {
        const {cars} = req.query;
        const search = await pool.query("SELECT * FROM cars_data WHERE company_name || ' ' || car_name ILIKE $1", [`%${cars}%`]);
        res.json(search.rows)
    } catch (err) {
        console.log(err);
    }
})


app.get('/compare', async(req, res)=> {
    try {
        const{cars} =req.query;
        const compare = await pool.query("SELECT * FROM cars_data WHERE company_name || ' ' || car_name ILIKE $1", [`%${cars}%`]);
        res.json(compare.rows);
        console.log(compare)
    } catch (error) {
        console.log(error);
    }
})

// app.get('/profile/:id', (req, res) => {
//     let found= false;
//     const {email, hashp} = res.body;
//     if(email === email || password === hashp){
//         found = true
//         return res.status(200).json("User Found")
//     }else{
//         res.status(400).json("Oops user not found. Try again")
//     }
// })



app.listen(port, () => {
    console.log(`Great Server is working at port: ${port}`); 
}) 


