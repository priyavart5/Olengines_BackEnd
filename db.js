import pg from "pg";

const pool = new pg.Pool({
    host : '127.0.0.1',
    user : 'priyavartvashisht',
    password : '',
    database : 'olengines_database'
})

export default pool;