import { Router } from 'express';
import { getGoodsTypes, createGoodsType, updateGoodsType, deleteGoodsType } from '../controllers/goodsType.controller';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation';
import { createGoodsTypeSchema } from '../validation/schemas';

const router = Router();

router.use(authenticateToken); // Protect all goods types routes

router.get('/', getGoodsTypes);
router.post('/', requireAdmin, validateBody(createGoodsTypeSchema), createGoodsType);
router.put('/:id', requireAdmin, validateBody(createGoodsTypeSchema), updateGoodsType);
router.delete('/:id', requireAdmin, deleteGoodsType);

export default router;

