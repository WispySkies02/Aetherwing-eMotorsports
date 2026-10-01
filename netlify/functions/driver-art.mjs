import bridgeApi from '../lib/_bridge.cjs';
import handlerApi from '../lib/_driver-art.cjs';
export default (request) => bridgeApi.bridge(request, handlerApi.handler);
