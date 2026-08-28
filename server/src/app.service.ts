import { Injectable } from '@nestjs/common'

@Injectable()
export class AppService {
  getInfo() {
    return {
      name: 'labarc-server',
      phase: 'Phase 1 — Foundation',
      status: 'ok',
    }
  }
}
