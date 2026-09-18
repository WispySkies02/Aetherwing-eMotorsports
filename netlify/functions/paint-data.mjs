import bridgeApi from '../lib/_bridge.cjs';
import handlerApi from '../lib/_paint-data.cjs';
export default (request) => bridgeApi.bridge(request, handlerApi.handler);
