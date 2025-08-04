import {request} from "../utils/request"

// 通用接口
function getTest() {
  return request({
    method: 'GET',
    url: 't'
  });
}

export {
  getTest
}