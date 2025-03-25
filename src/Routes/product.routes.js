import { Router } from 'express'
import { upload } from '../utils/multer.js';
import { isAdmin, verifyUserToken } from '../middleware/userVerify.middleware.js';
import { deleteProduct, getAllProducts, updateProduct, createProduct } from '../controller/product.controller.js';
const productRoute = Router();

productRoute.get('/all', getAllProducts);
productRoute.post('/create', verifyUserToken, isAdmin, upload.single('thumbnail'), createProduct);
productRoute.put('/update/:id', verifyUserToken, isAdmin, upload.single('thumbnail'), updateProduct)
productRoute.delete('/delete/:id', verifyUserToken, isAdmin, deleteProduct);

export default productRoute