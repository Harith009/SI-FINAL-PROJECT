'use strict';
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require('axios');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const PORT = 3000;
const app = express();
const path = require('path')
const multer  = require('multer')

var fs = require('fs');


const options = {
    swaggerDefinition: {
        info: {
            title: 'MS Azure Face Detection API',
            version: '1.0.0',
            description: 'API provides information about face from a provided image'
        },
        host: '137.184.50.131:3000',
        basePath: '/'
    },
    apis: ['./server.js']
}

const specs = swaggerJsdoc(options);

const multer_storage = multer.diskStorage({
    destination: './html/images', 
    filename: (req, file, cb) => {
        return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
});

const upload = multer({
    storage: multer_storage,
    limits: {
        fileSize: 6000000
    },
    fileFilter: function (req, file, cb) {
        var ext = path.extname(file.originalname);
        if (ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg' && ext !== '.bmp' && ext !== '.pdf' && ext !== '.tiff') {
            return cb(new  multer.MulterError('Only JPEG, PNG, BMP, PDF, and TIFF are allowed!'));
        }
        cb(null, true)
    },
});
// able to see swagger UI at <url>:port/docs
app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs));


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// cors will be used to enable cross origin request
app.use(cors());

// Valid subscription key and endpoint.
let subscriptionKey = "9fa2ae2aa59b4b45961761230483fdb5";
let endpoint = "https://afa1.cognitiveservices.azure.com/face/v1.0/detect";


 /**
 * @swagger
 * definitions:
 *   Detect faces in an image:
 *     properties:
 *       imageUrl:
 *         type: string
 *         description: URL of image, should be received from request
 */
/**
 * @swagger
 * /detectface:
 *    post:
 *      description: Detects the faces in image
 *      produces:
 *          - application/json
 *      responses:
 *          200:
 *              description: Successfully detects the face and provide a array of object containing the coordinates of faces detected in image.
 *          400:
 *              description: Bad Request or invalid request
 *          500:
 *              description: Internal server error
 *      parameters:
 *          - name: imageUrl
 *            description: the image url for face detection
 *            in: body
 *            required: true
 *            schema:
 *              $ref: '#/definitions/Detect faces in an image'
 *
 */
app.post("/detectface", async (req, res, next) => {
    let imageUrl="";
    if(!req.body.imageUrl){
        return res.status(400).json({
            message : "Bad Request or invalid request"
        });

    }else {
        imageUrl= req.body.imageUrl
    }

    console.log(imageUrl);
    let result = axios({
        method: 'post',
        url: endpoint,
        params : {
            detectionModel: 'detection_02',
            returnFaceId: true
        },
        data: {
            url: imageUrl,
        },
        headers: { 'Content-Type': 'application/json','Ocp-Apim-Subscription-Key': subscriptionKey }
    }).then(function (response) {
    
        console.log(response.data);
        if(response.data.length!=0){
            res.status(200).json(response.data);
        }else {
            res.status(200).json({
                "face": "No face detected"
            });
        }
    }).catch(function (error) {
        console.log(error)
        res.status(400).json({
            error
        })
    });
});

/**
 * @swagger
 * definitions:
 *   Detect faces in an image:
 */
/**
 * @swagger
 * /detectUploadedFace:
 *    post:
 *      description: Detects the faces in uploaded image
 *      requestBody:
 *          rerquired: true
 *          content: 
 *            multipart/form-data:
 *              schema:
 *                type: object
 *                properties: 
 *                  file:
 *                    type: string
 *                    format: base64
 *      produces:
 *          - application/json
 *      responses:
 *          200:
 *              description: Successfully detects the face and provide a array of object containing the coordinates of faces detected in image.
 *          400:
 *              description: Bad Request or invalid request
 *          500:
 *              description: Internal server error
 *      parameters:
 *          - name: file
 *            in: formData
 *            description: The uploaded file
 *            required: True
 *            type: file
 */
app.post("/detectUploadedFace", upload.single('file'),  (req, res) => {
let url_of_image = `http://137.184.50.131/images/${req.file.filename}`;     
let newOptions = {
    paraparams : {
        detectionModel: 'detection_02',
        returnFaceId: true
    },
    headers: { 'Content-Type': 'application/json','Ocp-Apim-Subscription-Key': subscriptionKey }
}
let data = {
    url: url_of_image
};    
axios.post(endpoint, data, newOptions)
    .then(resp => {
        res.send(resp.data);
    })
    .catch(error=>{
        console.log(error);
        res.status(error).json(error.response.data)
    });
});


 /**
 * @swagger
 * definitions:
 *   Detect landmarks in faces in an image:
 *     properties:
 *       imageUrl:
 *         type: string
 *         description: URL of image, should be received from request
 */
/**
 * @swagger
 * /detectfacelandmarks:
 *    post:
 *      description: Detects the features of faces in image
 *      produces:
 *          - application/json
 *      responses:
 *          200:
 *              description: Successfully detect the face and provide a array of object containing the coordinates of features (ex. nose, mouth, eye, eyebrow etc) of faces detected in image.
 *          400:
 *              description: Bad Request or invalid request
 *          500:
 *              description: Internal server error
 *      parameters:
 *          - name: imageUrl
 *            description: the image url for face detection or facelandmarks detection
 *            in: body
 *            required: true
 *            schema:
 *              $ref: '#/definitions/Detect landmarks in faces in an image'  
 *
 */
app.post("/detectfacelandmarks", async (req, res, next) => {
    let imageUrl="";
    if(!req.body.imageUrl){
        return res.status(400).json({
            message : "Bad Request or invalid request"
        })
    }else {
        imageUrl= req.body.imageUrl
    }

    console.log(imageUrl);
    let result = axios({
        method: 'post',
        url: endpoint,
        params : {
            detectionModel: 'detection_01',
            // returnFaceId: true,
            returnFaceLandmarks: true
        },
        data: {
            url: imageUrl,
        },
        headers: { 'Content-Type': 'application/json','Ocp-Apim-Subscription-Key': subscriptionKey }
    }).then(function (response) {
    
        console.log(response.data);
        if(response.data.length!=0){
            res.status(200).json(response.data);
        }else {
            res.status(200).json({
                "face": "No face detected"
            });
        }
    }).catch(function (error) {
        console.log(error)
        res.status(500).json({
            error
        })
    });
});

/**
 * @swagger
 * definitions:
 *   Detect emotions of faces in an image:
 *     properties:
 *       imageUrl:
 *         type: string
 *         description: URL of image, should be received from request
 */
/**
 * @swagger
 * /detectfaceemotions:
 *    post:
 *      description: Detects the emotions of faces in image
 *      produces:
 *          - application/json
 *      responses:
 *          200:
 *              description: Successfully detects the faces and provide a array of object containing the emotions present on faces in the image.
 *          400:
 *              description: Bad Request or invalid request
 *          500:
 *              description: Internal server error
 *      parameters:
 *          - name: imageUrl
 *            description: the image url for face detection or face emotions detection
 *            in: body
 *            required: true
 *            schema:
 *              $ref: '#/definitions/Detect emotions of faces in an image'
 *
 */
app.post("/detectfaceemotions", async (req, res, next) => {
    let imageUrl="";
    if(!req.body.imageUrl){
        return res.status(400).json({
            message : "Bad Request or invalid request"
        })
    }else {
        imageUrl= req.body.imageUrl
    }

    console.log(imageUrl);
    let result = axios({
        method: 'post',
        url: endpoint,
        params : {
            detectionModel: 'detection_01',
            returnFaceAttributes: 'age, gender, headPose'
        },
        data: {
            url: imageUrl,
        },
        headers: { 'Content-Type': 'application/json','Ocp-Apim-Subscription-Key': subscriptionKey }
    }).then(function (response) {
    
        console.log(response.data);
        if(response.data.length!=0){
            res.status(200).json(response.data);
        }else {
            res.status(200).json({
                "face": "No face detected"
            });
        }
    }).catch(function (error) {
        console.log(error)
        res.status(500).json({
            error
        })
    });
});


/**
 * @swagger
 * definitions:
 *   Detect similarity of faces in two images:
 *     properties:
 *       imageUrl1:
 *         type: string
 *         description: URL of image1, which needs to be compare with image2
 *       imageUrl2:
 *         type: string
 *         description: URL of image2, which needs to be compare with image1
 */
/**
 * @swagger
 * /findsimilar:
 *    post:
 *      description: Detects faces in two images are similar or not
 *      produces:
 *          - application/json
 *      responses:
 *          200:
 *              description: Successfully detect the faces and provide an object containing information that two faces are Similar or not.
 *          400:
 *              description: Bad Request or invalid request
 *          500:
 *              description: Internal server error
 *      parameters:
 *          - name: imageUrl
 *            description: the url of two images for finding similarity
 *            in: body
 *            required: true
 *            schema:
 *              $ref: '#/definitions/Detect similarity of faces in two images'
 *
 */

app.post("/findsimilar", async (req, res, next) => {
    let imageUrl1 = "";
    let imageUrl2 = "";
    if(!req.body.imageUrl1 || !req.body.imageUrl2){
        return res.status(400).json({
            message : "Bad Request or invalid request"
        })
    }else {
        imageUrl1 = req.body.imageUrl1;
        imageUrl2 =  req.body.imageUrl2
    }

    let f_id1 = "";
    let f_id2 = "";
    let azureEndpont = "https://eastus.api.cognitive.microsoft.com/face/v1.0/verify";
    axios({
        method: 'post',
        url: endpoint,
        params : {
            detectionModel: 'detection_02',
            returnFaceId: true
        },
        data: {
            url: imageUrl1,
        },
        headers: { 'Content-Type': 'application/json','Ocp-Apim-Subscription-Key': subscriptionKey }
    }).then(function (response) {
        f_id1 = response.data[0].faceId;
        console.log(response.data);
        axios({
            method: 'post',
            url: endpoint,
            params : {
                detectionModel: 'detection_02',
                returnFaceId: true
            },
            data: {
                url: imageUrl2,
            },
            headers: { 'Content-Type': 'application/json','Ocp-Apim-Subscription-Key': subscriptionKey }
        }).then(function (response) {
            f_id2 = response.data[0].faceId;
            axios({
                method: 'post',
                url: azureEndpont,
                data: {
                    faceId1: f_id1,
                    faceId2: f_id2
                },
                headers: { 'Content-Type': 'application/json','Ocp-Apim-Subscription-Key': subscriptionKey }
            }).then(function (response) {
                res.status(200).json(response.data);
                
            }).catch(function (error) {
                console.log(error);
                res.status(500).json({
                    error
                })
            });
            
        }).catch(function (error) {
            console.log(error)
        });
    }).catch(function (error) {
        console.log(error)
    });
});

app.listen(PORT, () => {
    console.log(`API served at http://137.184.50.131:${PORT}`);
});
