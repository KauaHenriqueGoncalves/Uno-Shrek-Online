import BlacklistedTokenRepository from "../repository/BlacklistedTokenRepository.js";
import BlacklistedToken from "../shared/token/BlacklistedToken.js";

export default class TokenService {
  constructor() {
    this.repo = new BlacklistedTokenRepository(BlacklistedToken);
  }

  async blacklistToken(token, expiresAt) {
    return await this.repo.create({ token, expiresAt });
  }

  async isBlacklisted(token) {
    return await this.repo.existsByToken(token);
  }
}
