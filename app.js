const express = require("express");
const app = express();
const mongoose = require("mongoose");
const exphbs = require("express-handlebars");
const session = require('express-session');
const bcrypt = require('bcrypt');
const cors = require('cors')
const validaciones = require('./validaciones');
const rutasHola = require('./rutas-hola');
//const app = require("./rutas-hola");

app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');
//cada vez que hay formulario son esta linea no funciona
app.use(express.urlencoded());
app.use(express.json());
app.use(cors());

app.use(session({secret: "klsfushf28343kjhsjksdgfsdh"}));


async function conectar() {
    await mongoose.connect("mongodb+srv://pwi:covid2020@pwi-qlcyv.gcp.mongodb.net/test?retryWrites=true&w=majority", {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    console.log("Conectado a la base de datos metodo: mongoodb - async-await");
};
conectar();

const RecetaSchema = new mongoose.Schema({
    nombre: String,
    ingredientes: String,
    instrucciones: String,
    creador: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'usuarios'
    }
})

const UsuarioSchema = new mongoose.Schema({
    username: String,
    password: String
})

const RecetaModel = mongoose.model("recetas", RecetaSchema);
const UsuarioModel = mongoose.model("usuarios", UsuarioSchema);

async function inicializarUsuarios() {
    let usuarios = await UsuarioModel.find();
    if(usuarios.length==0) {
        await UsuarioModel.create({
            username: 'admin@admin.com',
            password: 'admin1234'
        })
    }
}

inicializarUsuarios();

//RecetaModel(lo uso para llamar al vector)
//Muestra el formulario de receta
app.get("/agregar", function (req, res) {
    //RecetaModel.create({
    //  nombre:"Panqueque",
    //  ingredientes:"harina,huevos,leche",
    //  instrucciones:"Mezclar todo"
    //});
    //res.send("Receta creada")
    res.render("formulario");
});
//Recibe el formulario de receta
app.post("/agregar", async function (req, res) {
    await RecetaModel.create({
        nombre: req.body.nombre,
        ingredientes: req.body.ingredientes,
        instrucciones: req.body.instrucciones,
    });
    res.redirect('/recetas');
});
app.get("/api/recetas", async function (req, res) {
    const listado = await RecetaModel.find().populate('creador');
    //console.log(listado);
    res.send(listado);
})
app.get("/api/recetas/:id", async function (req, res) {
    const UnaReceta = await RecetaModel.findById(req.params.id).populate('creador');
    //console.log(UnaReceta);
    //UnaReceta.creador = await UsuarioModel.findById(UnaReceta.creador);
    res.send(UnaReceta);
})

//Agregar Receta por api
app.post("/api/recetas", async function (req, res) {
    console.log(req.body);
    let RecetaAgregada = await RecetaModel.create({
        nombre: req.body.nombre,
        ingredientes: req.body.ingredientes,
        instrucciones: req.body.instrucciones,
        creador: req.body.usuario_id
    })
    // res.sendStatus(201).send();
    res.status(201).send(RecetaAgregada);
})

//Borrar Receta
app.delete("/api/recetas/:id", async function (req, res) {
    await RecetaModel.findByIdAndRemove(req.params.id);
    res.sendStatus(204).send();
})

//Actualizar Receta
app.put("/api/recetas/:id", async function (req, res) {
    let RecetaActualizada = await RecetaModel.findByIdAndUpdate(req.params.id, {
        nombre: req.body.nombre,
        ingredientes: req.body.ingredientes,
        instrucciones: req.body.instrucciones
    });
    res.sendStatus(200).send();
})

app.get("/recetas", async function (req, res) {
    console.log('asdads');
    const listado = await RecetaModel.find().lean();
    res.render("listado", { listado: listado });
})

app.get("/borrar/:id", async function (req, res) {
    await RecetaModel.findByIdAndRemove(req.params.id);
    res.redirect("/recetas");
});

app.get("/editar/:id", async function (req, res) {
    let receta = await RecetaModel.findById(req.params.id).lean();
    res.render("formulario", { datos: receta });
});

//Actualizar los datos
app.post("/editar/:id", async function (req, res) {
    await RecetaModel.findByIdAndUpdate(req.params.id, {
        nombre: req.body.nombre,
        ingredientes: req.body.ingredientes,
        instrucciones: req.body.instrucciones
    });
    res.redirect("/recetas");
});

app.get("/", function (req, res) {
    res.redirect("/recetas");
});


// Mostrar pagina de login
app.get('/signin', function(req, res) {
    res.render('login');
});

// Validar usuario para login
app.post('/signin', async function(req, res) {
    // req.body.email / req.body.password
    // admin@mail.com
    // admin123
    // const usuario = await Usuario.find({email: req.body.email});
    const usuario = await UsuarioModel.findOne({username: req.body.email});
    if (!usuario) {
        // El usuario es incorrecto
        res.send('Usuario/password incorrecto');
        return;
    }
    const passwordDelFormulario = req.body.password;
    const passwordDeLaBase = usuario.password;
    if (bcrypt.compareSync(passwordDelFormulario, passwordDeLaBase)) {
        // Usuario y password correcto
        req.session.usuario_ok = true;
        req.session.email = req.body.email;
        req.session.user_id = usuario._id;
        res.redirect('/segura');
    } else {
        // La contraseña no coincide
        res.send('Usuario/password incorrecto');
    }
});

// Ruta para usuario logeados
app.get('/segura', function(req, res) {
    if (!req.session.usuario_ok) {
        res.redirect('/signin');
        return;
    }
    //res.render('view');
    res.send('Ingreaste a la seccion de administracion');
})

// Cerrar sesion
app.get('/logout', function(req, res) {
    req.session.destroy();
    res.redirect('/signin');
})

// Mostrar formulario de registracion
app.get('/signup', function(req, res) {
    res.render('signup');
})

// Registrar el usuario
app.post('/signup', async function(req, res) {
    // req.body.email
    // req.body.password
    // Validar que haya ingresado email y password
    const pasaValidacion = validaciones.validar_registro(req.body.email, req.body.password);
    //if (req.body.email.length<3 || req.body.password.length<4) {
    if (pasaValidacion==false) {
        res.render('signup');
        return;
    }

    const existe = await UsuarioModel.findOne({username: req.body.email});
    if (existe) {
        res.send('Usuario ya existe');
        return
    }
    const password_encriptado = await bcrypt.hash(req.body.password, 10);

    const nuevoUsuario = await UsuarioModel.create({
        username: req.body.email,
        password: password_encriptado
    });
    // res.redirect('/signin');
    // return;
    req.session.usuario_ok = true;
    req.session.email = req.body.email;
    req.session.user_id = nuevoUsuario._id;
    res.redirect('/segura');
});


app.use('/hola', rutasHola);
//app.use('/api/recetas', rutasApiRecetas);

const port = process.env.PORT ? process.env.PORT : 3000;


// App iniciando
app.listen(port, function () {
    console.log("App http://localhost:" +  port);
})