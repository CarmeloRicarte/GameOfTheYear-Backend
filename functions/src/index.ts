import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as express from 'express';
import * as cors from 'cors';

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://gameoftheyear-crr.firebaseio.com"
});

const db = admin.firestore();

// Express
const app = express();
app.use( cors({origin: true}) ); // permite peticiones cors a otros dominios

app.get('/goty', async(req, res) => {
    const gotyRef = db.collection('goty');
    // obtenemos toda la informacion de la coleccion
    const docsSnap = await gotyRef.get();
    // hacemos un mapeo del array para sacar solo los datos de cada documento
    const juegos = docsSnap.docs.map( doc => doc.data());
    res.json(juegos);
});

app.post('/goty/:id', async(req, res) => {
    const id = req.params.id;
    const gameRef = db.collection('goty').doc(id); // indicamos la referencia a la coleccion con el id que le pasamos
    const gameSnap = await gameRef.get();

    // si no existe el id, devuelve mensaje de error
    if (!gameSnap.exists) {
        res.status(404).json({
            ok: false,
            mensaje: 'No existe un juego con el ID ' + id
        });
    } else {
        const votosAntes = gameSnap.data() || { votos: 0};
        await gameRef.update({
            votos: votosAntes.votos + 1 // incrementamos los votos
        });

        res.json({
            ok: true,
            mensaje: `Gracias por tus votos a ${votosAntes.nombre}`
        });
    }
});

// de esta forma exportamos la const app para que se pueda usar
// en una peticion en cloud functions de Firebase
export const api = functions.https.onRequest(app);
