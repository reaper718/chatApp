'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */

    await queryInterface.bulkInsert('Users',[
      {
        name: 'John Smith',
        email: 'test@gmail.com',
        phone: '1234567890',
        password: '12345678'
      },
      {
        name: 'Jane Doe',
        email: 'test2@gmail.com',
        phone: '9876543210',
        password: '12345678'
      },
      {
        name: 'Allen Morgan',
        email: 'rudrasabnani@gmail.com',
        phone: '9585756555',
        password: '12345678'
      }
    ])
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  }
};
