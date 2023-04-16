import { Request, Response, NextFunction } from 'express';
import PrerenderAgent, {
  CachedRender,
  PrerenderedPageResponse,
} from '../PrerenderAgent';

export async function prerenderExpressMiddleware(
  agent: PrerenderAgent,
  beforeRender: (req: Request, res: Response) => Promise<CachedRender>,
  afterRender: (
    err: Error | null,
    req: Request,
    prerenderedPageResponse?: PrerenderedPageResponse
  ) => { cancelRender: boolean }
) {
  return async function (req: Request, res: Response, next: NextFunction) {
    if (!agent.shouldShowPrerenderedPage(req.url, req.method, req.headers))
      return next();

    try {
      const cachedRender = await beforeRender(req, res);

      if (cachedRender) {
        if (typeof cachedRender === 'string') {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          return res.end(cachedRender);
        } else if (typeof cachedRender === 'object') {
          res.writeHead(cachedRender.status || 200, {
            'Content-Type': 'text/html',
          });
          return res.end(cachedRender.body || '');
        }
      }
    } catch (error) {
      // this is a user-defined function, so we don't want to
      // do anything with the error
      throw error;
    }

    try {
      const prerenderedPageResponse = await agent.getPrerenderedPageResponse(
        req.url,
        req.headers
      );

      const options = afterRender(null, req, prerenderedPageResponse);
      if (options && options.cancelRender) return next();

      res.writeHead(
        prerenderedPageResponse.statusCode,
        prerenderedPageResponse.headers
      );
      return res.end(prerenderedPageResponse.body);
    } catch (error) {
      const options = afterRender(error, req);
      if (options && options.cancelRender) return next();

      next(error);
    }
  };
}
