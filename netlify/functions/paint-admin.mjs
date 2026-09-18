import bridgeApi from '../lib/_bridge.cjs';
import handlerApi from '../lib/_paint-admin.cjs';
export default (request) => bridgeApi.bridge(request, handlerApi.handler, true);
