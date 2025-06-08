// backend/init-mongo-app-user.js
// Este script é executado pelo Docker ao iniciar o MongoDB pela primeira vez
// e cria o usuário que a aplicação Flask usará para se conectar.

// HARDCODED PARA DEBUG - NÃO USAR EM PRODUÇÃO
var appUser = "admin";
var appPassword = "admin";
// FIM HARDCODED

var appDb = process.env.MONGO_INITDB_DATABASE; // 'mydatabase'

// Cria o usuário da aplicação no banco 'admin' com permissões para 'mydatabase'
db.getSiblingDB('admin').createUser(
    {
        user: appUser,
        pwd: appPassword,
        roles: [
            { role: "readWrite", db: appDb },
            { role: "dbAdmin", db: appDb },
            { role: "read", db: "admin" }
        ]
    }
);
print(`Usuário MongoDB '${appUser}' criado no banco 'admin' com sucesso.`);

db.getSiblingDB(appDb).createCollection('temp_collection');
print(`Banco de dados '${appDb}' assegurado.`);