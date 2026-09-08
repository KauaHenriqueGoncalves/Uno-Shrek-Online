import PinoGlobal from "../shared/logger/pino-global.logger.js";
import TrackingRepository from "./tracking.repository.js";

export default class TrackingService {
  constructor(schema) {
    this.trackingRepository = new TrackingRepository(schema);
    this.log = PinoGlobal.getInstance();
  }

  async getRequestStats() {
    const records = await this.trackingRepository.getAll();
    this.log.debug(`Building request stats. [count=${records.length}]`);

    const requestsByMethod = records.reduce((acc, record) => {
      acc[record.requestMethod] = (acc[record.requestMethod] ?? 0) + 1;
      return acc;
    }, {});

    const maxCount = Math.max(...Object.values(requestsByMethod), 0);
    const mostUsedMethodEntry = Object.entries(requestsByMethod).find(
      ([, count]) => count === maxCount,
    );

    return {
      totalRequests: records.length,
      requestsByMethod,
      mostUsedMethod: mostUsedMethodEntry ? mostUsedMethodEntry[0] : null,
    };
  }

  async getResponseTimeStats() {
    const records = await this.trackingRepository.getAll();
    this.log.debug(`Building response time stats. [count=${records.length}]`);

    if (records.length === 0) {
      return { average: 0, min: 0, max: 0, byEndpoint: [] };
    }

    const responseTimes = records.map((record) => record.responseTime);
    const average =
      responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const min = responseTimes.reduce((acc, time) => Math.min(acc, time), Infinity);
    const max = responseTimes.reduce((acc, time) => Math.max(acc, time), -Infinity);

    const groupedByEndpoint = records.reduce((acc, record) => {
      const group = acc[record.endpointAccess] ?? [];
      group.push(record.responseTime);
      acc[record.endpointAccess] = group;
      return acc;
    }, {});

    const byEndpoint = Object.entries(groupedByEndpoint).map(([endpoint, times]) => ({
      endpoint,
      average: times.reduce((sum, time) => sum + time, 0) / times.length,
    }));

    return { average, min, max, byEndpoint };
  }

  async getStatusCodeStats() {
    const records = await this.trackingRepository.getAll();
    this.log.debug(`Building status code stats. [count=${records.length}]`);

    const byStatusCode = records.reduce((acc, record) => {
      acc[record.statusCode] = (acc[record.statusCode] ?? 0) + 1;
      return acc;
    }, {});

    const errorCount = records.filter((record) => record.statusCode >= 400).length;
    const errorRate = records.length === 0 ? 0 : errorCount / records.length;
    const hasServerErrors = records.some((record) => record.statusCode >= 500);

    return { byStatusCode, errorRate, hasServerErrors };
  }

  async getPopularEndpoints() {
    const records = await this.trackingRepository.getAll();
    this.log.debug(`Building popular endpoints stats. [count=${records.length}]`);

    const countByEndpoint = records.reduce((acc, record) => {
      acc[record.endpointAccess] = (acc[record.endpointAccess] ?? 0) + 1;
      return acc;
    }, {});

    return Object.entries(countByEndpoint)
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }
}
