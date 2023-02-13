import multer from "multer";
import path from "path";
import reply from "../Common/reply.js";


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, `./assets/${req.headers.mypath}`);
    },

    filename: function (req, file, cb) {
        let extensionFile = path.extname(file.originalname);
        let saveFileName = `${Date.now()}${extensionFile}`;
        // console.log({extensionFile,saveFileName})
        cb(null, saveFileName);
    }
});

const checkFileType = (file, cb) => {
    var ext = path.extname(file?.originalname);

    if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg' && ext !== '.pdf') {
        return cb(new Error('Only png, jpg , jpeg and pdf are allowed'));
    }

    return cb(null, true);
}

// done
const upload = multer({
    storage: storage, fileFilter: (req, file, cb) => { checkFileType(file, cb) }
}).single("file");



const customFileUpload = (req, res, next) => {
    const Image_not_required_array = ["/comment_create"];

    upload(req, res, async(err) => {
        // console.log('herefilr===', req.file)
        if(err){
            // console.log('ifError', err.message)
            let result = reply.failed(err.message);
            req.filedata = result;
            return  next();
        }

        if(req.file == undefined && Image_not_required_array.includes(req.path)){
            let result = reply.failed("Image is not available");
            req.filedata = result;
            return  next();
        }

        if (req.file == undefined) {
            req.filedata = reply.failed("Please Upload Image or File");
            return next();
        }

        req.filedata = reply.success(req?.file?.filename);
        
        return next();
    });
}

export default customFileUpload;

